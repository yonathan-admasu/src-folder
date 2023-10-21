const changeDate = (date: string, separator: string) => {
  const dateParts = date.split("-");
  const changedDate = `${dateParts[1]}${separator}${dateParts[2]}${separator}${dateParts[0]}`;
  return changedDate;
};

export default changeDate;
