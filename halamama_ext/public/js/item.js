frappe.ui.form.on("Item", {
    setup(frm) {
        // Item Category: Show only parent categories
        frm.set_query("item_category", function () {
            return {
                filters: {
                    is_group: 1
                }
            };
        });

        // Item Sub Category: Show children of the selected parent
        frm.set_query("item_sub_category", function () {
            if (!frm.doc.item_category) {
                return {
                    filters: {
                        name: ["=", ""]
                    }
                };
            }

            return {
                filters: {
                    parent_product_category: frm.doc.item_category,
                    is_group: 0
                }
            };
        });
    },

    item_category(frm) {
        // Clear subcategory when parent category changes
        frm.set_value("item_sub_category", "");
    }
});