// function stringToColor(string: string) {
//   let hash = 0;
//   let i;

//   /* eslint-disable no-bitwise */
//   for (i = 0; i < string.length; i += 1) {
//     hash = string.charCodeAt(i) + ((hash << 5) - hash);
//   }

//   let color = "#";

//   for (i = 0; i < 3; i += 1) {
//     const value = (hash >> (i * 8)) & 0xff;
//     color += `00${value.toString(16)}`.slice(-2);
//   }

//   return color;
// }

function stringToColor(string: string) {
  const colors = [
    "#F68B1F", // Orange
    "#FF7043", // Deep Orange
    "#8E24AA", // Purple
    "#1E88E5", // Blue
    "#43A047", // Green
    "#FDD835", // Yellow
    "#D81B60", // Pink
    "#3949AB", // Indigo
    "#00897B", // Teal
    "#00ACC1", // Cyan
  ];

  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function stringAvatar(name: string) {
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: 100,
      height: 100,
    },
    children: `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`,
  };
}
