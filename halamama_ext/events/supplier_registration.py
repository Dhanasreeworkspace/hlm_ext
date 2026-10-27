import json

import frappe
from frappe import _
from frappe.utils import validate_email_address


TERMS_FIELD_MAP = {
    "trade_license": "cr_number",
    "lead_time": "lead_time_for_delivery",
    "order_pattern": "order_pattern",
    "returns_policy": "item_return_policy",
    "other_terms": "other_terms",
}


@frappe.whitelist(allow_guest=True)
def create_supplier_registration(data=None):
    """
    Create a Supplier with its linked Address, primary Contact,
    Bank Account, optional management Contacts, and terms.
    """

    if data is None:
        data = frappe.local.form_dict.get("data")

    if isinstance(data, str):
        try:
            data = json.loads(data)
        except (TypeError, ValueError):
            frappe.throw(_("Invalid registration data."))

    if not isinstance(data, dict):
        frappe.throw(_("Invalid registration data."))

    supplier_data = data.get("supplier") or {}
    address_data = data.get("address") or {}
    contact_data = data.get("contact") or {}
    bank_data = data.get("bank_account") or {}
    management_contacts = data.get("management_contacts") or []
    terms_data = data.get("terms") or {}

    if not all(
        isinstance(value, dict)
        for value in (
            supplier_data,
            address_data,
            contact_data,
            bank_data,
            terms_data,
        )
    ):
        frappe.throw(_("Invalid Supplier, Address, Contact, Bank Account or Terms data."))

    if not isinstance(management_contacts, list):
        frappe.throw(_("Management Contacts must be a list."))

    # --------------------------------------------------
    # 1. Validate Supplier
    # --------------------------------------------------

    supplier_name = (supplier_data.get("supplier_name") or "").strip()

    if not supplier_name:
        frappe.throw(_("Supplier Name is required."))

    supplier_type = (
        supplier_data.get("supplier_type") or "Company"
    ).strip()

    if supplier_type not in ("Company", "Individual", "Partnership"):
        frappe.throw(_("Invalid Supplier Type."))

    allowed_fields = {
        "supplier_name",
        "supplier_type",
        "supplier_group",
        "country",
        "website",
        "tax_id",
        "supplier_details",
        "business_name",
        "holding_company",
        "parent_holding_company",
        "cr_number",
    }

    supplier_meta = frappe.get_meta("Supplier")

    supplier_values = {}

    for fieldname in allowed_fields:
        value = supplier_data.get(fieldname)

        if value in (None, ""):
            continue

        if not supplier_meta.has_field(fieldname):
            frappe.throw(
                _("Supplier field '{0}' does not exist.").format(fieldname)
            )

        supplier_values[fieldname] = value

    if supplier_values.get("country"):
        if not frappe.db.exists("Country", supplier_values["country"]):
            frappe.throw(_("The selected Supplier Country does not exist."))

    if supplier_values.get("supplier_group"):
        if not frappe.db.exists(
            "Supplier Group", supplier_values["supplier_group"]
        ):
            frappe.throw(_("The selected Supplier Group does not exist."))

    # --------------------------------------------------
    # 2. Validate Address
    # --------------------------------------------------

    address_line1 = (address_data.get("address_line1") or "").strip()
    city = (address_data.get("city") or "").strip()
    country = (address_data.get("country") or "").strip()

    if not address_line1:
        frappe.throw(_("Address Line 1 is required."))

    if not city:
        frappe.throw(_("City is required."))

    if not country:
        frappe.throw(_("Country is required."))

    if not frappe.db.exists("Country", country):
        frappe.throw(_("Country '{0}' does not exist.").format(country))

    # --------------------------------------------------
    # 3. Validate Primary Contact
    # --------------------------------------------------

    contact_name = (contact_data.get("first_name") or "").strip()
    contact_email = (contact_data.get("email_id") or "").strip()
    contact_phone = (contact_data.get("phone") or "").strip()

    if not contact_name:
        frappe.throw(_("Contact Person Name is required."))

    if not contact_email:
        frappe.throw(_("Contact Email is required."))

    validate_email_address(contact_email, throw=True)

    # --------------------------------------------------
    # 4. Validate Bank Account
    # --------------------------------------------------

    account_name = (bank_data.get("account_name") or "").strip()
    bank_name = (bank_data.get("bank") or "").strip()
    account_no = (bank_data.get("bank_account_no") or "").strip()
    iban = (bank_data.get("iban") or "").strip()

    if not account_name or not bank_name or not account_no:
        frappe.throw(
            _("Bank Account Name, Bank and Account Number are required.")
        )

    if not frappe.db.exists("Bank", bank_name):
        frappe.throw(_("Bank '{0}' does not exist.").format(bank_name))

    # --------------------------------------------------
    # 5. Validate Management Contacts
    # --------------------------------------------------

    for index, management_contact in enumerate(management_contacts, start=1):
        if not isinstance(management_contact, dict):
            frappe.throw(
                _("Management Contact {0} must be an object.").format(index)
            )

        name = (management_contact.get("first_name") or "").strip()
        email = (management_contact.get("email_id") or "").strip()

        # Management contacts are optional.
        if not name:
            if email or management_contact.get("phone"):
                frappe.throw(
                    _("Management Contact {0} has an email but no name.").format(
                        index
                    )
                )
            continue

        if email:
            validate_email_address(email, throw=True)

    # --------------------------------------------------
    # 6. Validate Terms and Conditions
    # --------------------------------------------------

    for key, value in terms_data.items():
        if not str(value or "").strip():
            continue

        fieldname = TERMS_FIELD_MAP.get(key)

        if not fieldname:
            frappe.throw(
                _(
                    "The Terms field '{0}' has no configured Supplier "
                    "fieldname. Update TERMS_FIELD_MAP."
                ).format(key)
            )

        if not supplier_meta.has_field(fieldname):
            frappe.throw(
                _("Supplier field '{0}' does not exist.").format(fieldname)
            )

    # --------------------------------------------------
    # 7. Create Supplier
    # --------------------------------------------------

    supplier = frappe.get_doc({
        "doctype": "Supplier",
        **supplier_values,
    })

    for key, fieldname in TERMS_FIELD_MAP.items():
        value = terms_data.get(key)

        if value not in (None, ""):
            supplier.set(fieldname, value)

    supplier.insert(ignore_permissions=True)

    # --------------------------------------------------
    # 8. Create and Link Address
    # --------------------------------------------------

    address = frappe.get_doc({
        "doctype": "Address",
        "address_title": supplier.supplier_name,
        "address_type": "Office",
        "address_line1": address_line1,
        "address_line2": (
            address_data.get("address_line2") or ""
        ).strip(),
        "city": city,
        "state": (address_data.get("state") or "").strip(),
        "country": country,
        "pincode": (address_data.get("pincode") or "").strip(),
        "links": [
            {
                "link_doctype": "Supplier",
                "link_name": supplier.name,
            }
        ],
    })

    address.insert(ignore_permissions=True)

    # --------------------------------------------------
    # 9. Create and Link Primary Contact
    # --------------------------------------------------

    contact_values = {
        "doctype": "Contact",
        "first_name": contact_name,
        "is_primary_contact": 1,
        "links": [
            {
                "link_doctype": "Supplier",
                "link_name": supplier.name,
            }
        ],
        "phone_nos": (
            [
                {
                    "phone": contact_phone,
                    "is_primary_mobile_no": 1,
                }
            ]
            if contact_phone
            else []
        ),
        "email_ids": [
            {
                "email_id": contact_email,
                "is_primary": 1,
            }
        ],
    }

    contact = frappe.get_doc(contact_values)
    contact.insert(ignore_permissions=True)

    # --------------------------------------------------
    # 10. Create Bank Account Linked to Supplier
    # --------------------------------------------------

    bank_meta = frappe.get_meta("Bank Account")

    required_bank_fields = [
        "account_name",
        "bank",
        "bank_account_no",
        "party_type",
        "party",
    ]

    missing_fields = [
        fieldname
        for fieldname in required_bank_fields
        if not bank_meta.has_field(fieldname)
    ]

    if missing_fields:
        frappe.throw(
            _(
                "Bank Account DocType is missing required fields: {0}. "
                "Check Customize Form > Bank Account."
            ).format(", ".join(missing_fields))
        )

    bank_values = {
        "doctype": "Bank Account",
        "account_name": account_name,
        "bank": bank_name,
        "bank_account_no": account_no,
        "party_type": "Supplier",
        "party": supplier.name,
    }

    # Add optional fields only if they exist and have values.
    optional_bank_values = {
        "iban": iban,
        "swift_code": (bank_data.get("swift_code") or "").strip(),
        "branch_code": (bank_data.get("branch_code") or "").strip(),
        "bank_address": (bank_data.get("bank_address") or "").strip(),
    }

    for fieldname, value in optional_bank_values.items():
        if bank_meta.has_field(fieldname) and value:
            bank_values[fieldname] = value

    if bank_meta.has_field("is_company_account"):
        bank_values["is_company_account"] = 0

    bank_account = frappe.get_doc(bank_values)
    bank_account.insert(ignore_permissions=True)

    # --------------------------------------------------
    # 11. Create Optional Management Contacts
    # --------------------------------------------------

    created_management_contacts = []
    contact_meta = frappe.get_meta("Contact")

    for management_contact in management_contacts:
        name = (management_contact.get("first_name") or "").strip()

        if not name:
            continue

        email = (management_contact.get("email_id") or "").strip()
        phone = (management_contact.get("phone") or "").strip()
        role = (management_contact.get("role") or "").strip()

        contact_values = {
            "doctype": "Contact",
            "first_name": name,
            "links": [
                {
                    "link_doctype": "Supplier",
                    "link_name": supplier.name,
                }
            ],
            "phone_nos": (
                [
                    {
                        "phone": phone,
                        "is_primary_mobile_no": 1,
                    }
                ]
                if phone
                else []
            ),
            "email_ids": (
                [
                    {
                        "email_id": email,
                        "is_primary": 1,
                    }
                ]
                if email
                else []
            ),
        }

        # The role heading is saved as the Contact designation if supported.
        if contact_meta.has_field("designation") and role:
            contact_values["designation"] = role

        management_contact_doc = frappe.get_doc(contact_values)
        management_contact_doc.insert(ignore_permissions=True)

        created_management_contacts.append(
            management_contact_doc.name
        )

    # --------------------------------------------------
    # 12. Set Supplier Primary Address, Contact and Bank
    # --------------------------------------------------

    supplier.supplier_primary_address = address.name
    supplier.supplier_primary_contact = contact.name

    # Find the Supplier field used for the default company bank account.
    bank_link_field = None

    for candidate in (
        "default_company_bank_account",
        "default_bank_account",
    ):
        if supplier_meta.has_field(candidate):
            bank_link_field = candidate
            break

    if not bank_link_field:
        for field in supplier_meta.fields:
            if ((field.label or "").strip().lower() == "default company bank account"):
                bank_link_field = field.fieldname
                break

    if bank_link_field:
        supplier.set(bank_link_field, bank_account.name)

    supplier.save(ignore_permissions=True)

    return {
        "success": True,
        "supplier": supplier.name,
        "address": address.name,
        "contact": contact.name,
        "bank_account": bank_account.name,
        "management_contacts": created_management_contacts,
        "message": _("Supplier registration completed successfully."),
    }


@frappe.whitelist(allow_guest=True)
def get_supplier_registration_banks():
    """Return existing Bank records for the public Supplier Registration form."""

    banks = frappe.get_all(
        "Bank",
        fields=["name"],
        order_by="name asc",
        limit_page_length=500,
    )

    return [
        {"value": bank.name, "label": bank.name}
        for bank in banks
    ]


@frappe.whitelist(allow_guest=True)
def get_supplier_registration_countries():
    """Return existing countries for the public Supplier Registration form."""

    countries = frappe.get_all(
        "Country",
        fields=["name"],
        order_by="name asc",
        limit_page_length=500,
    )

    return [
        {"value": country.name, "label": country.name}
        for country in countries
    ]


@frappe.whitelist(allow_guest=True)
def get_supplier_registration_designations():
    """Return existing Designation records for the Supplier Registration form."""

    designations = frappe.get_all(
        "Designation",
        fields=["name"],
        order_by="name asc",
        limit_page_length=500,
    )

    return [
        {"value": designation.name, "label": designation.name}
        for designation in designations
    ]
