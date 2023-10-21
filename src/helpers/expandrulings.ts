// import fs from "fs";
// import path from "path";
// import Ruling, { IRuling } from "../models/ruling";

// const months = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ];

// const getRulings = async (rulingsArray: IRuling[]): Promise<ReturnRuling[]> => {
//   const returnRulings: ReturnRuling[] = [];

//   for (const ruling of rulingsArray) {
//     const [month, day, year] = ruling.date.split("/");
//     const rulingPath = path.join(__dirname, "../content/rulings", ruling.url);
//     let rulingContent = "";

//     try {
//       rulingContent = fs.readFileSync(rulingPath, "utf8");
//     } catch (err) {
//       // Handle error if file does not exist
//     }

//     if (ruling.caseNumbers) {
//       for (const casenumber of ruling.casenumbers) {
//         const regex = new RegExp(
//           `<b>\\sCase Number:\\s</b>\\s${casenumber}.+?<hr>`,
//           "gs"
//         );
//         let caseContent = "";

//         if (rulingContent) {
//           const match = rulingContent.match(regex);
//           if (match) {
//             caseContent = match[0];
//           }
//         }

//         const returnRuling: ReturnRuling = {
//           id: ruling._id,
//           date: ruling.date,
//           day,
//           month,
//           year,
//           judge: ruling.judge.name,
//           courthouse: ruling.department.courthouse.name,
//           department: ruling.department.name,
//           casenumber,
//           content: caseContent,
//         };

//         returnRulings.push({ ...returnRuling });
//       }
//     }
//   }

//   return returnRulings;
// };

// export default getRulings;
