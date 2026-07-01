import katex, { type KatexOptions } from "katex";
import type { MathNode, InlineMath } from "node_modules/satteri/dist/types";
import { defineMdastPlugin, type MdastVisitorContext } from "satteri";

export type KatexPluginOptions = Omit<
  KatexOptions,
  "displayMode" | "throwOnError"
>;

/**
 * 
 * Replacement for rehypeKatex, which is to render Latex properly in the HTML output.
 * Much faster as a Satteri plugin b/c Satteri exposes the Markdown AST directly, so we don't have to traverse the HTML AST to find math nodes.
 * Also Satteri is in Rust, so it's faster than remark/rehype which are in JS.
 */
export function katexPlugin(options: KatexPluginOptions = {}) {
  return defineMdastPlugin({
    name: "katex",

    math(node, ctx) {
      return render(node.value, true, options, ctx, node);
    },

    inlineMath(node, ctx) {
      return render(node.value, false, options, ctx, node);
    },
  });
}

// Adapted from https://github.com/remarkjs/remark-math/blob/main/packages/rehype-katex/lib/index.js
function render(
  value: string,
  displayMode: boolean,
  options: KatexPluginOptions,
  ctx: MdastVisitorContext,
  node: Readonly<MathNode> | Readonly<InlineMath>
) {
  try {
    return {
      rawHtml: katex.renderToString(value, {
        ...options,
        displayMode,
        throwOnError: true,
      }),
    };
  } catch (err) {
    ctx.report({
      message: "Could not render math with KaTeX",
      node,
      severity: "warning",
    });

    try {
      return {
        rawHtml: katex.renderToString(value, {
          ...options,
          displayMode,
          throwOnError: false,
          strict: "ignore",
        }),
      };
    } catch {
      const color = options.errorColor ?? "#cc0000";

      return {
        rawHtml: `<span
          class="katex-error"
          style="color:${color}"
          title="${escapeHtml(String(err))}"
        >${escapeHtml(value)}</span>`,
      };
    }
  }
}

// Small subset of possible strings but enough for this use case
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}