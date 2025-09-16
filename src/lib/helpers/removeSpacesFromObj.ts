export const removeSpacesFromObject = (obj: any) => {
  if (!obj) return obj;

  let arrayFromObj = Object.entries(obj);

  if (arrayFromObj?.length) {
    let updatedObj = arrayFromObj
      .map(([key, value]: any[]) => {
        if (typeof value == "string") {
          return { [key]: value?.trim() };
        } else {
          return { [key]: value };
        }
      })
      .reduce((acc, obj) => {
        return { ...acc, ...obj };
      }, {});
    return updatedObj;
  } else {
    return obj;
  }
};