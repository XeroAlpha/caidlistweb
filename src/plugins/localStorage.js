export default function (Vue) {
    function parseJSON(str, defaultValue) {
        try {
            return JSON.parse(str);
        } catch (err) {
            return defaultValue();
        }
    }

    function stringifyJSON(any) {
        try {
            return JSON.stringify(any);
        } catch (err) {
            return String(any);
        }
    }

    Vue.prototype.$useLocalStorage = function (namespace, storageKeys) {
        const thisObj = this;
        const prefix = namespace ? namespace + ":" : "";
        storageKeys.forEach((key) => {
            const defaultValue = thisObj[key];
            const storageKey = prefix + key;
            const storageValue = localStorage.getItem(storageKey);
            if (storageValue !== null) {
                let value = parseJSON(storageValue, () => defaultValue);
                if (typeof defaultValue != typeof value) {
                    value = defaultValue;
                }
                thisObj[key] = value;
            }
            thisObj.$watch(key, (newValue) => {
                localStorage.setItem(storageKey, stringifyJSON(newValue));
            }, {
                deep: true,
                immediate: true
            });
        });
    };
}
