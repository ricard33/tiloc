import Quill from "quill";
import "./PageBreak.scss";

const BlockEmbed = Quill.import("blots/block/embed");

type PageBreakOptions = {}

class PageBreak extends BlockEmbed {
  // private quill: Quill;
  // private options: PageBreakOptions;

  // constructor(quill: Quill, options: PageBreakOptions) {
  //   this.quill = quill;
  //   this.options = options;
  //
  //   quill.keyboard.addBinding(
  //     {
  //       key: "13",
  //       shiftKey: true
  //     },
  //     this.enterHandler.bind(this)
  //   );
  //   quill.keyboard.bindings[13].unshift(quill.keyboard.bindings[13].pop());
  //   quill.clipboard.addMatcher("BR", function() {
  //     let newDelta = new Delta();
  //     newDelta.insert({ "break": "" });
  //     return newDelta;
  //   });
  //
  //   let length = quill.getLength();
  //   let text = quill.getText(length - 2, 2);
  //   if (text === "\n\n") {
  //     quill.deleteText(quill.getLength() - 2, 2);
  //   }
  // }
  //
  // enterHandler(range) {
  //   let currentLeaf = this.quill.getLeaf(range.index)[0];
  //   let nextLeaf = this.quill.getLeaf(range.index + 1)[0];
  //
  //   this.quill.insertEmbed(range.index, "break", true, "user");
  //
  //   // Insert a second break if:
  //   // At the end of the editor, OR next leaf has a different parent (<p>)
  //   if (nextLeaf === null || (currentLeaf.parent !== nextLeaf.parent)) {
  //     this.quill.insertEmbed(range.index, "break", true, "user");
  //   }
  //
  //   // Now that we've inserted a line break, move the cursor forward
  //   this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
  // }

  static create() {
    let node = super.create();
    node.setAttribute("className", "page-break");
    node.setAttribute("style", "display: block; page-break-after: always; ");
    return node;
  }

  static value(domNode: Element) {
    return {
      className: domNode.getAttribute("className"),
      style: domNode.getAttribute("style")
    };
  }
}

PageBreak.blotName = "page-break";
PageBreak.tagName = "div";
PageBreak.className = "page-break";

export default PageBreak;
