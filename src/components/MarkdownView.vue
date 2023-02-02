<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="markdown-view">
    <div
      class="markdown-body"
      v-html="markdownHTML"
    />
  </div>
</template>

<script>
import { marked } from "marked";
import hljs from "highlight.js/lib/core";
import DOMPurify from "dompurify";

import json from "highlight.js/lib/languages/json";
import javascript from "highlight.js/lib/languages/javascript";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import python from "highlight.js/lib/languages/python";

hljs.registerLanguage("json", json);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("java", java);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("python", python);

export default {
  props: {
    value: {
      type: String,
      required: true,
    }
  },

  computed: {
    markdownHTML() {
      const html = marked(this.value, {
        highlight(code, lang) {
          const language = hljs.getLanguage(lang) ? lang : "plaintext";
          return hljs.highlight(code, { language }).value;
        },
        langPrefix: "hljs language-"
      });
      return DOMPurify.sanitize(html);
    },
  },
}
</script>

<style lang="scss">
.v-application.theme--light .markdown-view {
  @import "github-markdown-css/github-markdown-light";
  @import "highlight.js/scss/github.scss";
}
.v-application.theme--dark .markdown-view {
  @import "github-markdown-css/github-markdown-dark";
  @import "highlight.js/scss/github-dark.scss";
}
.markdown-view {
  background-color: unset !important;
  code {
    background-color: unset !important;
  }
}
</style>