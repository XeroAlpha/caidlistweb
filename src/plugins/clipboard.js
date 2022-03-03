export default function (Vue) {
    Vue.prototype.$copyText = async function (text, successTextId) {
        try {
            if (typeof navigator != "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                if (successTextId) {
                    this.$toast(this.$t(successTextId, [text]));
                } else {
                    if (text.length > 20) {
                        this.$toast(this.$t("copyText.successEllipsis", [text.slice(0, 20)]));
                    } else {
                        this.$toast(this.$t("copyText.success", [text]));
                    }
                }
            } else {
                this.$toast(this.$t("copyText.failedInaccessible"));
            }
        } catch (err) {
            this.$toast(this.$t("copyText.failedUnknown", [err]));
        }
    };
}
