import React, { useEffect } from "react";
// @ts-ignore
import { CKEditor } from "@ckeditor/ckeditor5-react";
// @ts-ignore
import CustomEditor from "@ti-gecko/tiloc-ckeditor5/build/ckeditor";  // import symbol ClassicEditor
// import DocumentEditor from "@ckeditor/ckeditor5-build-decoupled-document";
// import CustomFigureAttributes from 'tiloc-ckeditor5/plugins/custom-figure-attributes';
// import AllowImageWidth from 'tiloc-ckeditor5/plugins/image_width_and_height';
import "./Editor.css";

type Props = {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  withPlaceholders?: boolean,
};

const Editor: React.FunctionComponent<Props> = (props) => {
  const { content, onChange, readOnly, withPlaceholders} = props;
  let editorInstance: any = null;

  useEffect(() => {
    if (editorInstance)
      editorInstance.setData(content);
  }, [content, editorInstance]);

  // @ts-ignore
  function _onChange(event, editor) {
    onChange && onChange(editor.getData());
  }

  return (
    <div className="document-editor">
      <div className="document-editor__toolbar" />
      <div className="document-editor__editable-container">
        <CKEditor
          className="document-editor__editable"
          onReady={(editor: any) => {
            console.log("Editor is ready to use!", editor);
            editorInstance = editor;

            const toolbarContainer = document.querySelector(".document-editor__toolbar");
            if (toolbarContainer)
              toolbarContainer.appendChild(
                editor.ui.view.toolbar.element);
          }}
          readOnly={readOnly}
          onChange={_onChange}
          editor={CustomEditor}
          data={content}
          config={{
            // extraPlugins: [CustomFigureAttributes,],
            // extraPlugins: [AllowImageWidth],
            ...(withPlaceholders ? {} : {removePlugins: ["Placeholder", "PlaceholderEditing", "PlaceholderUI"]}),
            // removePlugins: ["Placeholder", "PlaceholderEditing", "PlaceholderUI"],
            // removePlugins: "Placeholder",
            toolbar: {
              items: [
                ...(withPlaceholders ? ["placeholder", "|"] : []),
                "heading",
                "|",
                "bold",
                "italic",
                "underline",
                "link",
                "bulletedList",
                "numberedList",
                "alignment",
                "fontFamily",
                "fontSize",
                "fontColor",
                // "removeFormat",
                "|",
                "indent",
                "outdent",
                "|",
                // "imageUpload",
                // "blockQuote",
                "insertTable",
                "undo",
                "redo",
                "|",
                "horizontalLine",
                "pageBreak",
                "|",
                "specialCharacters"
                // "|",
                // "insertSignature"
              ]
            },
            language: "fr",
            fontSize: {
              options: [
                9,
                10,
                11,
                12,
                13,
                "default",
                17,
                19,
                21
              ]
            },
            image: {
              resizeUnit: "px",

              // Configure the available styles.
              styles: [
                "alignLeft", "alignCenter", "alignRight"
              ],

              // Configure the available image resize options.
              resizeOptions: [
                {
                  name: "imageResize:original",
                  label: "Original",
                  value: null
                },
                {
                  name: "imageResize:50",
                  label: "50%",
                  value: "50"
                },
                {
                  name: "imageResize:75",
                  label: "75%",
                  value: "75"
                }
              ],
              toolbar: [
                "imageTextAlternative",
                "imageStyle:alignLeft", "imageStyle:alignCenter", "imageStyle:alignRight",
                "|",
                "imageResize"
              ]
            },
            simpleUpload: {
              // The URL that the images are uploaded to.
              uploadUrl: "/upload/",

              // Enable the XMLHttpRequest.withCredentials property.
              withCredentials: true,

              // Headers sent along with the XMLHttpRequest to the upload server.
              headers: {
                // "X-CSRF-TOKEN": "CSRF-Token",
                Authorization: "Token " + localStorage.getItem("token")
              }
            },
            table: {
              contentToolbar: [
                "tableColumn",
                "tableRow",
                "mergeTableCells",
                "tableCellProperties",
                "tableProperties"
              ]
            },
            placeholderConfig: {
              types: [
                "DATE",
                "Propriétaire_NOM",
                "Propriétaire_PRENOM",
                "Propriétaire_ADRESSE_POSTALE",
                "Propriétaire_TELEPHONE",
                "Propriétaire_EMAIL",
                "Voyageur_NOM_COMPLET",
                "Voyageur_ADRESSE_POSTALE",
                "Voyageur_CONTACT",
                "Voyageur_EMAIL",
                "Voyageur_TELEPHONE",
                "Logement_NOM",
                // "Logement_PAGE_WEB_ANNONCE",
                "Logement_ADRESSE_POSTALE",
                // "Logement_GPS",
                // "Logement_TYPE",
                // "Logement_NBS_CHAMBRES",
                // "Logement_SURFACE",
                // "Logement_CLASSEMENT",
                "Logement_CAPACITE",
                // "Logement_DESCRIPTIF",
                "Logement_DEPOT_GARANTIE",
                // "Logement_HORAIRE_ARRIVEE",
                // "Logement_HORAIRE_DEPART",
                "Logement_MODALITE_PAIEMENT",
                // "Logement_METHODE_PAIEMENT",
                // "Logement_DEPOT_G_MONTANT",
                // "Logement_DEPOT_G_DELAI",
                "Réservation_DATE_ARRIVEE",
                "Réservation_DATE_DEPART",
                "Réservation_NB_NUITS",
                "Réservation_MONTANT",
                "Réservation_MONTANT_AVEC_OPTIONS",
                "Réservation_ARRHES",
                "Réservation_SOLDE_APRES_ARRHES",
                "Réservation_NB_VOYAGEURS",
                "Réservation_NB_ADULTES",
                "Réservation_NB_ENFANTS",
                "Réservation_NB_BEBES",
                "Réservation_DATE",
                "Réservation_SERVICES_INCLUS",
                "Réservation_SERVICES_ADDITIONELS",
                "Réservation_TAXE_DE_SEJOUR_PAR_NUIT_PAR_PERSONNE",
                "Réservation_TAXE_DE_SEJOUR",
                "Réservation_ECHEANCE_DU_SOLDE",
                // "Signature_LOCATAIRE",
                "Signature_BAILLEUR"
              ]
            }
          }}
        />
      </div>
    </div>

  );
};

export default Editor;
