frappe.ui.form.on("Customer", {
    setup(frm) {
        frm.set_query("consignment_warehouse", () => ({
            filters: {
                external: 1,
                warehouse_type: "Consignment"
            }
        }));
    },

    refresh(frm) {
        frm.toggle_reqd(
            "consignment_warehouse",
            frm.doc.customer_group === "Consignment"
        );
    },

    customer_group(frm) {
        frm.toggle_reqd(
            "consignment_warehouse",
            frm.doc.customer_group === "Consignment"
        );
    }
});