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

    function loadAllStorageKV(valueFilter, keyFilter) {
        const storageObj = {};
        let i;
        if (!keyFilter) keyFilter = (k) => k;
        if (!valueFilter) valueFilter = (_, v) => v;
        for (i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            let value = localStorage.getItem(key);
            key = keyFilter(key, value);
            value = valueFilter(key, value);
            if (key != null) {
                storageObj[key] = value;
            }
        }
        return storageObj;
    }

    Vue.prototype.$useLocalStorage = function (namespace, storageKeys, targetVersion, onMigrate) {
        const thisObj = this;
        const prefix = namespace ? namespace + ":" : "";
        if (targetVersion) {
            this.$migrateLocalStorage(namespace, targetVersion, onMigrate);
        }
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
            thisObj.$watch(
                key,
                (newValue) => {
                    localStorage.setItem(storageKey, stringifyJSON(newValue));
                },
                {
                    deep: true,
                    immediate: true
                }
            );
        });
    };

    Vue.prototype.$migrateLocalStorage = function (namespace, targetVersion, onMigrate) {
        const prefix = namespace ? namespace + ":" : "";
        const versionKey = prefix + "$version";
        let currentVersion = localStorage.getItem(versionKey);
        if (currentVersion == targetVersion) return;
        const storageObj = loadAllStorageKV(
            (_, v) => parseJSON(v, () => null),
            (k) => (k.startsWith(prefix) && k != versionKey ? k.slice(prefix.length) : null)
        );
        const storageKeys = Object.keys(storageObj);
        if (onMigrate) {
            while (currentVersion != targetVersion) {
                currentVersion = onMigrate(currentVersion, targetVersion, storageObj) || targetVersion;
            }
        } else {
            currentVersion = targetVersion;
        }
        const migratedStorageKeys = Object.keys(storageObj);
        const removedStorageKeys = storageKeys.filter((k) => !migratedStorageKeys.includes(k));
        removedStorageKeys.forEach((k) => {
            localStorage.removeItem(prefix + k);
        });
        migratedStorageKeys.forEach((k) => {
            localStorage.setItem(prefix + k, stringifyJSON(storageObj[k]));
        });
        localStorage.setItem(versionKey, currentVersion);
    };
}
