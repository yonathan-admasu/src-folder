const similarity = (s1: string, s2: string): number => {
  if (!s1 || !s2) {
    throw new Error("Input strings cannot be null or empty.");
  }

  let longer = s1;
  let shorter = s2;

  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }

  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }

  return (
    (longerLength - editDistance(longer.toLowerCase(), shorter.toLowerCase())) /
    longerLength
  ); // No need to convert to float
};

const editDistance = (s1: string, s2: string): number => {
  if (!s1 || !s2) {
    throw new Error("Input strings cannot be null or empty.");
  }

  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }

  return costs[s2.length];
};

export default similarity;
