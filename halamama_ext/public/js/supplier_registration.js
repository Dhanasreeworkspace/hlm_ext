frappe.ready(function () {
    const path = window.location.pathname.replace(/\/+$/, "");

    // Run only on the Supplier Registration Web Form
    if (!path.startsWith("/supplier-registration")) {
        return;
    }

    const web_form = frappe.web_form;

    if ($("#supplier-registration-details").length) {
        return;
    }

    const html = `
        <div id="supplier-registration-details">

            <hr>
            <h5>Business Address</h5>

            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Address Line 1 *</label>
                        <input type="text" id="address_line1" class="form-control">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Address Line 2</label>
                        <input type="text" id="address_line2" class="form-control">
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>City *</label>
                        <input type="text" id="address_city" class="form-control">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>State</label>
                        <input type="text" id="address_state" class="form-control">
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Country *</label>
                        <select id="address_country" class="form-control">
                            <option value="">Select Country</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Postal Code</label>
                        <input type="text" id="address_pincode" class="form-control">
                    </div>
                </div>
            </div>

            <hr>
            <h5>Primary Contact</h5>

            <div class="form-group">
                <label>Name *</label>
                <input type="text" id="contact_name" class="form-control">
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="contact_phone" class="form-control">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" id="contact_email" class="form-control">
                    </div>
                </div>
            </div>

            <hr>
            <h5>Key Management Contacts</h5>

            <div id="management-contacts" class="table-responsive">
                <table class="table table-bordered" id="management-contacts-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;">Designation</th>
                            <th style="width: 25%;">Name</th>
                            <th style="width: 20%;">Phone</th>
                            <th style="width: 30%;">Email</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <button type="button"
                    id="add-management-contact"
                    class="btn btn-sm btn-default">
                + Add Another Contact
            </button>

            <hr>
            <h5>Bank Account Details</h5>

            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Account Name *</label>
                        <input type="text" id="bank_account_name" class="form-control">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Account Number *</label>
                        <input type="text" id="bank_account_no" class="form-control">
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="bank_name">
                            Bank Name <span class="text-danger">*</span>
                        </label>
                        <select id="bank_name" class="form-control">
                            <option value="">Loading banks...</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Branch</label>
                        <input type="text" id="bank_branch" class="form-control">
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>IBAN</label>
                        <input type="text" id="bank_iban" class="form-control">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>SWIFT Code</label>
                        <input type="text" id="bank_swift" class="form-control">
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label>Address of Bank</label>
                <textarea id="bank_address" class="form-control"></textarea>
            </div>

            <hr>
            <h5>Terms & Conditions</h5>

            <div class="form-group">
                <label>Lead time for delivery (In days)</label>
                <input type="text" id="lead_time" class="form-control">
            </div>

            <div class="form-group">
                <label>Order Pattern</label>
                <textarea id="order_pattern" class="form-control"></textarea>
            </div>

            <div class="form-group">
                <label>Return of defected, near expiry, end of season items</label>
                <textarea id="returns_policy" class="form-control"></textarea>
            </div>

            <div class="form-group">
                <label>Other Terms</label>
                <textarea id="other_terms" class="form-control"></textarea>
            </div>

            <hr>
            <button type="button" id="supplier-registration-submit"
                class="btn btn-primary">
                Submit
            </button>

        </div>
    `;

    $(".web-form-body").append(html);

    // Load existing Bank records into the dropdown.
    const bankSelect = $("#bank_name");

    frappe.call({
        method: "halamama_ext.events.supplier_registration.get_supplier_registration_banks",

        callback: function (r) {
            bankSelect.empty();
            bankSelect.append(
                $("<option>", {
                    value: "",
                    text: __("Select Bank")
                })
            );

            (r.message || []).forEach(function (bank) {
                bankSelect.append(
                    $("<option>", {
                        value: bank.value,
                        text: bank.label
                    })
                );
            });
        },
    });

    // Load existing Country records into the dropdown.
    const countrySelect = $("#address_country");

    frappe.call({
        method: "halamama_ext.events.supplier_registration.get_supplier_registration_countries",

        callback: function (r) {
            countrySelect.empty();

            countrySelect.append(
                $("<option>", {
                    value: "",
                    text: __("Select Country")
                })
            );

            (r.message || []).forEach(function (country) {
                countrySelect.append(
                    $("<option>", {
                        value: country.value,
                        text: country.label
                    })
                );
            });
        },
    });

    // Key Management Contacts: start with one row and allow up to five.
    let management_designations = [];
    const max_management_contacts = 5;

    const management_table_body = $("#management-contacts-table tbody");

    management_table_body.empty();

    // Function to add one contact row.
    function add_management_contact_row() {
        const current_count = management_table_body.find("tr").length;

        if (current_count >= max_management_contacts) {
            frappe.msgprint(
                __("You can add a maximum of 5 management contacts.")
            );
            return;
        }

        const row = $(`
            <tr>
                <td>
                    <select class="form-control management-designation">
                        <option value="">Select Designation</option>
                    </select>
                </td>
                <td>
                    <input type="text"
                        class="form-control management-name"
                        placeholder="Name">
                </td>
                <td>
                    <input type="tel"
                        class="form-control management-phone"
                        placeholder="Phone">
                </td>
                <td>
                    <input type="email"
                        class="form-control management-email"
                        placeholder="Email">
                </td>
            </tr>
        `);

        const designation_select = row.find(".management-designation");

        // Populate the dropdown with existing Designation records.
        management_designations.forEach(function (designation) {
            designation_select.append(
                $("<option>", {
                    value: designation.value,
                    text: designation.label
                })
            );
        });

        management_table_body.append(row);
    }

    // Display one contact row initially.
    add_management_contact_row();

    // Add another contact when the button is clicked.
    $("#add-management-contact").on("click", function () {
        add_management_contact_row();
    });

    // Load Designation records from ERPNext.
    frappe.call({
        method: "halamama_ext.events.supplier_registration.get_supplier_registration_designations",

        callback: function (r) {
            management_designations = r.message || [];

            // Populate all rows, including rows added before the response arrived.
            $(".management-designation").each(function () {
                const select = $(this);
                const selected_value = select.val();

                select.empty().append(
                    $("<option>", {
                        value: "",
                        text: __("Select Designation")
                    })
                );

                management_designations.forEach(function (designation) {
                    select.append(
                        $("<option>", {
                            value: designation.value,
                            text: designation.label
                        })
                    );
                });

                select.val(selected_value);
            });
        },

        error: function () {
            frappe.msgprint(
                __("Unable to load Designations. Please refresh the page and try again.")
            );
        }
    });

    // Hide the native submit button.
    $(".web-form-footer button[type='submit']").hide();
    $(".web-form-footer input[type='submit']").hide();

    $("#supplier-registration-submit").on("click", function () {
        const button = $(this);

        // Read the Supplier fields from the rendered Web Form controls.
        const supplier = {};

        $(".web-form-body .frappe-control").each(function () {
            const fieldname = $(this).attr("data-fieldname");

            if (!fieldname) {
                return;
            }

            const control = web_form.fields_dict
                ? web_form.fields_dict[fieldname]
                : null;

            if (control && typeof control.get_value === "function") {
                supplier[fieldname] = control.get_value();
            } else {
                const input = $(this).find("input, select, textarea").first();

                if (input.length) {
                    supplier[fieldname] = input.val();
                }
            }
        });

        supplier.supplier_name = $.trim(
            supplier.supplier_name || ""
        );

        if (!supplier.supplier_name) {
            frappe.msgprint(__("Supplier Name is required."));
            return;
        }

        const required = [
            ["#address_line1", "Address Line 1"],
            ["#address_city", "City"],
            ["#address_country", "Country"],
            ["#contact_name", "Primary Contact Name"],
            ["#contact_email", "Primary Contact Email"],
            ["#bank_account_name", "Bank Account Name"],
            ["#bank_name", "Bank"],
            ["#bank_account_no", "Bank Account Number"]
        ];

        for (const [selector, label] of required) {
            if (!$.trim($(selector).val() || "")) {
                frappe.msgprint(__(label + " is required."));
                $(selector).trigger("focus");
                return;
            }
        }

        const email = $.trim($("#contact_email").val() || "");
        const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email_pattern.test(email)) {
            frappe.msgprint(
                __("Please enter a valid primary contact email.")
            );
            return;
        }

        // Collect Key Management Contacts.
        const management_contacts = [];

        $("#management-contacts-table tbody tr").each(function () {
            const row = $(this);

            const contact = {
                role: row.find(".management-designation").val() || "",
                first_name: $.trim(row.find(".management-name").val() || ""),
                phone: $.trim(row.find(".management-phone").val() || ""),
                email_id: $.trim(row.find(".management-email").val() || "")
            };

            if (
                contact.role ||
                contact.first_name ||
                contact.phone ||
                contact.email_id
            ) {
                management_contacts.push(contact);
            }
        });

        const data = {
            supplier: supplier,

            address: {
                address_line1: $.trim($("#address_line1").val() || ""),
                address_line2: $.trim($("#address_line2").val() || ""),
                city: $.trim($("#address_city").val() || ""),
                state: $.trim($("#address_state").val() || ""),
                country: $.trim($("#address_country").val() || ""),
                pincode: $.trim($("#address_pincode").val() || "")
            },

            contact: {
                first_name: $.trim($("#contact_name").val() || ""),
                phone: $.trim($("#contact_phone").val() || ""),
                email_id: email
            },

            bank_account: {
                account_name: $.trim($("#bank_account_name").val() || ""),
                bank: $("#bank_name").val() || "",
                bank_account_no: $.trim($("#bank_account_no").val() || ""),
                iban: $.trim($("#bank_iban").val() || ""),
                swift_code: $.trim($("#bank_swift").val() || ""),
                branch_code: $.trim($("#bank_branch").val() || ""),
                bank_address: $.trim($("#bank_address").val() || "")
            },

            management_contacts: management_contacts,

            terms: {
                trade_license: $.trim($("#trade_license").val() || ""),
                lead_time: $.trim($("#lead_time").val() || ""),
                order_pattern: $.trim($("#order_pattern").val() || ""),
                returns_policy: $.trim($("#returns_policy").val() || ""),
                other_terms: $.trim($("#other_terms").val() || "")
            }
        };

        button.prop("disabled", true).text(__("Submitting..."));

        frappe.call({
            method: "halamama_ext.events.supplier_registration.create_supplier_registration",
            args: {
                data: JSON.stringify(data)
            },
            freeze: true,
            freeze_message: __("Creating Supplier Registration..."),

            callback: function (r) {
                if (r.message && r.message.success) {
                    frappe.msgprint({
                        title: __("Success"),
                        message: r.message.message,
                        indicator: "green",
                        primary_action: {
                            label: __("Register New Supplier"),
                            action: function () {
                                window.location.reload();
                            }
                        }
                    });
                } else {
                    button.prop("disabled", false).text(__("Submit Registration"));
                }
            },

            error: function (r) {
                button.prop("disabled", false).text(__("Submit Registration"));
            },

            always: function () {
                button.prop("disabled", false).text(__("Submit Registration"));
            }
        });

    });
});
