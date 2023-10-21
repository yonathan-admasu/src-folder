import {
  PDFExtract,
  PDFExtractOptions,
  PDFExtractPage,
  PDFExtractText,
} from "pdf.js-extract";

const excludedDots = [
  " ltd.",
  " pvt.",
  " cal.",
  "app.",
  " id.",
  "rptr.",
  " ex.",
  " eg.",
  " e.g.",
  " v.",
  " co.",
  " assn.",
  " vs.",
  " p.",
  "e.x.",
];
const pdfHeadings = [
  "superior court of california",
  "county of",
  "hall of justice",
  "tentative rulings",
  "event date",
  "judicial officer",
  "case no",
  // 'case title:',
  "event time",
  "dept",
  "case category",
  "case type",
  "event type",
  "causal document",
];

const convertPdfToText = async (pdfPath: string) => {
  try {
    const pdfExtract = new PDFExtract();
    const option: PDFExtractOptions = {};
    const pdfData = await pdfExtract.extract(pdfPath, option);
    const data = extractData(pdfData.pages);

    let lines = data.split("\n");
    lines = lines.map((d) => d.replace(/\r/gi, ""));
    lines = lines.filter((d) => !/page\:/gi.test(d));
    lines = lines.filter((d) => d.toLowerCase() !== "[imaged]");

    let text = "";

    for (const line of lines) {
      if (pdfHeadings.some((ph) => line.trim().toLowerCase().startsWith(ph))) {
        text += line + "\n";
        continue;
      }
      if (
        /event id\:/gi.test(line.trim()) &&
        /tentative rulings/gi.test(line.trim())
      ) {
        continue;
      }
      if (/^\s+.*\[imaged\]$/gi.test(line)) {
        continue;
      }
      if (/\s{3}/gi.test(line)) {
        text += line + "\n";
        continue;
      }
      if (
        line === "" ||
        !line.endsWith(".") ||
        excludedDots.some((ed) => line.toLowerCase().endsWith(ed))
      ) {
        text += line + " ";
        continue;
      }
      text += line + "\n";
    }
    return text;
  } catch (error) {
    console.log(`convertPdfToText Error: ${error}`);
    throw error;
  }
};

const convertTextToHtml = async (text: string) => {
  try {
    const textData = text.split("\n");
    let html = "";
    for (const line of textData) {
      // If the line Starts with at least 3 spaces > center in paragraph
      if (/^\s{3}/gi.test(line)) {
        html += `<p style="text-align:center">${line
          .trim()
          .replace(/  /gi, "&nbsp;&nbsp")}</p>`;
        continue;
      }
      if (line.trim() == "") {
        html += "<br />";
        continue;
      }
      html += `<p>${line.trim().replace(/  /gi, "&nbsp;&nbsp")}</p>`;
    }
    return html;
  } catch (error) {
    console.log(`convertTextToHtml Error: ${error}`);
    throw error;
  }
};

const extractData = (pages: PDFExtractPage[]) => {
  let txt = "";
  let height = 0;

  pages.forEach((page, i) => {
    const contents: PDFExtractText[] = page.content;
    height = 0; // refresh the height when meeting the new page
    contents.forEach((content) => {
      if (height !== content.y) {
        height = content.y;
        txt += "\n";
      }
      txt += content.str;
    });
    txt += "\f";
  });
  return txt;
};

export const pdfUtils = { convertPdfToText, convertTextToHtml };
