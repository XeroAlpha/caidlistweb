export default {
    functional: true,
    props: {
        value: [String, Array]
    },
    render: function (h, context) {
        const text = context.props.value;
        if (Array.isArray(text)) {
            return h(
                "span",
                text.map((e, i) => {
                    return h("span", { class: { "highlight--text": i % 2 == 1 } }, e);
                })
            );
        } else {
            return h("span", text);
        }
    }
};
