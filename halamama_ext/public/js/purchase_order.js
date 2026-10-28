frappe.ui.form.on("Purchase Order", {
    supplier(frm) {
        update_required_by(frm);
    },

    transaction_date(frm) {
        update_required_by(frm);
    },

    refresh(frm) {
        if (frm.doc.supplier) {
            update_required_by(frm);
        }
    }
});

async function update_required_by(frm) {
    if (!frm.doc.supplier) {
        return;
    }

    try {
        const response = await frappe.db.get_value(
            "Supplier",
            frm.doc.supplier,
            "lead_time_for_delivery"
        );

        const lead_time = response.message?.lead_time_for_delivery;

        if (
            lead_time === null ||
            lead_time === undefined ||
            lead_time === ""
        ) {
            if (!frm.__lead_time_warning_shown) {
                frm.__lead_time_warning_shown = true;
                frappe.msgprint(__("Please set Lead Time for Delivery in the Supplier record.")
                );
            }
            return;
        }
        frm.__lead_time_warning_shown = false;

        const today = frappe.datetime.get_today();

        const required_date = frappe.datetime.add_days(
            today,
            Number(lead_time)
        );

        await frm.set_value("schedule_date", required_date);

        await frm.script_manager.trigger(
            "schedule_date",
             frm.doctype,
             frm.docname
);
    } catch (error) {
        console.error("Error updating Required By date:", error);

        frappe.msgprint(
            __("Unable to update Required By date.")
        );
    }
}