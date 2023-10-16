import { Plugin } from "@ckeditor/ckeditor5-core";
import { Widget, toWidget, viewToModelPositionOutsideModelElement } from "@ckeditor/ckeditor5-widget";
import PlaceholderCommand from "./placeholdercommand";                                              // ADDED
import "./theme/placeholder.css";

export default class PlaceholderEditing extends Plugin {
  static get requires() {
    return [Widget];
  }

  init() {
    console.log("PlaceholderEditing#init() got called");

    this._defineSchema();
    this._defineConverters();

    this.editor.commands.add("placeholder", new PlaceholderCommand(this.editor));

    this.editor.editing.mapper.on(
      "viewToModelPosition",
      viewToModelPositionOutsideModelElement(this.editor.model, viewElement => viewElement.hasClass("placeholder"))
    );
    this.editor.config.define("placeholderConfig", {
      types: [
        "logement.nom", "lodging.address", "lodging.capacity", "lodging.tourist_tax"]
    });
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register("placeholder", {
      // Behaves like a self-contained inline object (e.g. an inline image)
      // allowed in places where $text is allowed (e.g. in paragraphs).
      // The inline widget can have the same attributes as text (for example linkHref, bold).
      inheritAllFrom: "$inlineObject",

      // The placeholder can have many types, like date, name, surname, etc:
      allowAttributes: ["name"]
    });
  }

  _defineConverters() {
    const conversion = this.editor.conversion;

    conversion.for("upcast").elementToElement({
      view: {
        name: "span",
        classes: ["placeholder"]
      },
      model: (viewElement, { writer: modelWriter }) => {
        // Extract the "name" from "{{name]}".
        const data = viewElement.getChild(0) ? viewElement.getChild(0).data : "";
        if(data.startsWith("{{") && data.endsWith("}}")) {
          const name = data.slice(2, -2);
          return modelWriter.createElement("placeholder", { name });
        }
        else
          return modelWriter.createElement("placeholder", { name: data });
      }
    });

    conversion.for("editingDowncast").elementToElement({
      model: "placeholder",
      view: (modelItem, { writer: viewWriter }) => {
        const widgetElement = createPlaceholderView(modelItem, viewWriter);

        // Enable widget handling on a placeholder element inside the editing view.
        return toWidget(widgetElement, viewWriter);
      }
    });

    conversion.for("dataDowncast").elementToElement({
      model: "placeholder",
      view: (modelItem, { writer: viewWriter }) => createPlaceholderView(modelItem, viewWriter)
    });

    // Helper method for both downcast converters.
    function createPlaceholderView(modelItem, viewWriter) {
      const name = modelItem.getAttribute("name");

      const placeholderView = viewWriter.createContainerElement("span", {
        class: "placeholder"
      });

      // Insert the placeholder name (as a text).
      const innerText = viewWriter.createText("{{" + name + "}}");
      viewWriter.insert(viewWriter.createPositionAt(placeholderView, 0), innerText);

      return placeholderView;
    }
  }
}

