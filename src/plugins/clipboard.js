export default function (Vue) {
    Vue.prototype.$copyText = async function (text, successText) {
        try {
            if (typeof navigator != "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                if (successText) {
                    this.$toastT(successText, [text]);
                } else {
                    if (text.length > 20) {
                        this.$toastT("copyText.successEllipsis", [text.slice(0, 20)]);
                    } else {
                        this.$toastT("copyText.success", [text]);
                    }
                }
            } else {
                this.$toastT("copyText.failedInaccessible");
            }
        } catch (err) {
            this.$toastT("copyText.failedUnknown", [err]);
        }
    };
}
