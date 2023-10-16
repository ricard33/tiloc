import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import signatureIcon from "./Insert-signature.svg";
import ButtonView from "@ckeditor/ckeditor5-ui/src/button/buttonview";

export default class InsertSignature extends Plugin {
  init() {
    const editor = this.editor;

    editor.ui.componentFactory.add("insertSignature", locale => {
      const view = new ButtonView(locale);

      view.set({
        label: "Insert owner signature",
        icon: signatureIcon,
        tooltip: true
      });

      // Callback executed once the image is clicked.
      view.on("execute", () => {
        editor.model.change(writer => {
          const imageElement = writer.createElement("image", {
            style: "width: 300px; height: 150px",
            src: "{{ url_server }}{{ owner.signature.url }}",
            alt: "Signature"
          });

          // Insert the image in the current selection location.
          editor.model.insertContent(imageElement, editor.model.document.selection);

        });
      });

      return view;
    });
  }
}

