export function sortArrayByObjectProperty<T = any> (data: T[], propertyKey: keyof T, valuesOrder: any []): T [] {
  const sortedData = data.sort((first, second) => {
    let firstPropertyValueIndex = valuesOrder.indexOf(first[propertyKey]);
    if (firstPropertyValueIndex === -1) {
      firstPropertyValueIndex = valuesOrder.length;
    }

    let secondPropertyValueIndex = valuesOrder.indexOf(second[propertyKey]);
    if (secondPropertyValueIndex === -1) {
      secondPropertyValueIndex = valuesOrder.length;
    }

    // Handle
    if (firstPropertyValueIndex < secondPropertyValueIndex) {
      return -1;
    }
    else if (firstPropertyValueIndex > secondPropertyValueIndex) {
      return 1;
    }
    else {
      return 0;
    }

  });

  return sortedData;

}
