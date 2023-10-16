import axios from "axios";
import fileDownload from "js-file-download";

export function makePDF(url: string, defaultFilename: string) {
  axios
    .get(url, {
      responseType: "blob" // important
    })
    .then((response) => {
      const contentDisposition = response.headers["content-disposition"];
      const fileName = contentDisposition ? contentDisposition.split("filename=")[1] : defaultFilename;

      fileDownload(response.data, fileName);
    })
    .catch((error)=> {
      if(error.response.data instanceof Blob)
        error.response.data.text().then((content: string) => {
          console.error(JSON.parse(content).detail);
        })
    });
}
