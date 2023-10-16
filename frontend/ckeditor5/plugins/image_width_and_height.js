export default class AllowImageWidth {
  constructor(editor) {
    // Save reference to the editor.
    this.editor = editor;
  }

  afterInit() {
    const editor = this.editor;

    // Allow the "imageWidth" attribute in the editor model.
    editor.model.schema.extend('image', { allowAttributes: 'imageWidth' });

    // Tell the editor that the model "imageWidth" attribute converts into <img width="..."></img>
    editor.conversion.for('downcast').attributeToElement({
      model: 'imageWidth',
      view: (attributeValue, { writer }) => {
        console.debug('downcast', attributeValue);
        const imgElement = writer.createAttributeElement('img', { width: attributeValue }, { priority: 5 });
        writer.setCustomProperty('image', true, imgElement);

        return imgElement;
      },
      converterPriority: 'low'
    });

    // Tell the editor that <img width="..."></img> converts into the "imageWidth" attribute in the model.
    editor.conversion.for('upcast').attributeToAttribute({
      view: {
        name: 'img',
        key: 'width'
      },
      model: 'imageWidth',
      converterPriority: 'low'
    });
  }
}
