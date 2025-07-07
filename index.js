const spanTypeCard = document.getElementById("card-type");
const inputCardNo = document.getElementById("card-no");

const inputCardHolderName = document.getElementById("cardholder-name");

const inputCardThru = document.getElementById("card-thru");

const inputCardCvv = document.getElementById("card-cvv");

let cardTypeName = "Card Network";
let cvcSize = 3;

const cardPatterns = {
  visa: {
    // Starts with 4.13, 16, or 19 digits.
    name: "Visa",
    regex: /^4[0-9]{12}(?:[0-9]{3})?(?:[0-9]{3})?$/,
  },
  masterCard: {
    // Starts with 51-55 or 2221-2720. 16 digits.
    name: "Master Card",
    regex:
      /^(5[1-5][0-9]{14}|2(?:22[1-9]|[3-6][0-9]{2}|7[0-1][0-9]|720)[0-9]{12})$/,
  },
  amex: {
    // Starts with 34 or 37. 15 digits.
    name: "American Express",
    regex: /^3[47][0-9]{13}$/,
  },
  dinersClub: {
    // Starts with 300-305, 36, or 38-39. 14, 16, or 19 digits.
    name: "Diners Club",
    regex: /^3(?:0[0-5]|[689][0-9])[0-9]{11,16}$/,
  },
  discover: {
    // Starts with 6011, 644-649, 65. 16-19 digits.
    name: "Discover",
    regex:
      /^6(?:011|5[0-9]{2}|4[4-9][0-9]|22(?:1(?:2[6-9]|[3-9][0-9])|[2-8][0-9]{2}|9(?:[0-1][0-9]|2[0-5]))|3[7-9][0-9])(?:[0-9]{12,15})$/,
  },
  jbc: {
    // Starts with 3528-3589. 16 or 19 digits
    name: "JBC",
    regex: /^(?:352[8-9]|35[3-8][0-9])[0-9]{12}(?:[0-9]{3})?$/,
  },
  unionPay: {
    // Starts with 62. 16-19 digits.
    name: "UnionPay",
    regex: /^62[0-9]{14,17}$/,
  },
  rupay: {
    // Starts with 60, 64, 65. 16-19 digits.
    name: "RuPay",
    regex: /^6(?:0[0-9]{2}|5[0-9]{2}|4[0-9]{2})[0-9]{12,15}$/,
  },
  elo: {
    //  16 digits.
    name: "Elo",
    regex:
      /^(?:40117[8-9]|431274|438935|451416|457393|457631|504175|506699|509[0-9]{3}|627780|636297|636368|65003[1-5]|65004[0-1]|6504[0-9]{2}|6505[0-9]{2}|6509[0-6][0-9]|6516[5-9][0-9]|65500[0-9]|65501[0-9]|65502[1-9])([0-9]{10,13})$/,
  },
  maestro: {
    // Starts with 50, 56-69. 12-19 digits.
    name: "Maestro",
    regex: /^(?:5[06-9]|6[0-9])[0-9]{10,17}$/,
  },
  mir: {
    // Starts with 2200-2204. 16-19 digits.
    name: "Mir",
    regex: /^220[0-4][0-9]{12,15}$/,
  },
};

const detectCardType = (number) => {
  const cards = cardPatterns;
  for (const key in cards) {
    if (cards[key].regex.test(number)) {
      return cards[key].name;
    }
  }
  return "Card Network";
};

const luhnCheck = (value) => {
  let sum = 0;
  let alternate = false;

  for (let i = value.length - 1; i >= 0; i--) {
    let digit = parseInt(value.charAt(i), 10);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
};

const formatCardNumber = (value, cardTypeName) => {
  switch (cardTypeName) {
    case cardPatterns.amex.name: // 4-6-5
      return value.replace(/^(\d{4})(\d{6})(\d{0,5})/, "$1 $2 $3").trim();

    case cardPatterns.dinersClub.name: // 4-6-4
      if (value.length <= 14) {
        return value.replace(/^(\d{4})(\d{6})(\d{0,4})/, "$1 $2 $3").trim();
      }

    default: // 4-4
      return value.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }
};

const sanitizeNumber = (value, size) => {
  return String(value).trim().replace(/\D/g, "").slice(0, size);
  // 19 for 23 with " " format
  // 4 for 5 with / format
  // 3-4 for cvv
};

// TODO: implementar validar Luhn
const getValidCard = (value) => {
  const sanitizedValue = sanitizeNumber(value, 19);

  if (!sanitizedValue) {
    return false;
  }

  cardTypeName = detectCardType(sanitizedValue);

  const isLuhn = luhnCheck(sanitizedValue);

  if (!isLuhn) {
    return false;
  }

  return true;
};

const updateCardInput = (number) => {
  const sanitizedValue = sanitizeNumber(number, 19);

  cardTypeName = detectCardType(sanitizedValue);

  cvcSize = cardTypeName === cardPatterns.amex.name ? 4 : 3;

  const formatValue = formatCardNumber(sanitizedValue, cardTypeName);

  spanTypeCard.textContent = cardTypeName;
  inputCardCvv.placeholder = "*".repeat(cvcSize);

  return formatValue;
};

// only numbers, and others key
const isKeyAllowed = ({ key, ctrlKey, metaKey }, isCtrl) => {
  const regexNumber = /[\d]/;

  const allowedKeys = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Home",
    "End",
  ];

  if (isCtrl) {
    if ((ctrlKey || metaKey) && (key === "v" || key === "V")) {
      return true;
    }
  }

  if (regexNumber.test(key) || allowedKeys.includes(key)) {
    return true;
  }

  return false;
};

const handleDelimiterBackspaceDelete = (event, delimiterChar) => {
  const input = event.target;
  const { selectionStart, selectionEnd, value } = input;
  const key = event.key;

  const isPrevCharSpace = value[selectionStart - 1] === delimiterChar;
  const isNextCharSpace = value[selectionStart] === delimiterChar;

  const hasNoSelection = selectionStart === selectionEnd;

  if (
    key === "Backspace" &&
    isPrevCharSpace &&
    hasNoSelection &&
    selectionStart > 1
  ) {
    event.preventDefault();
    return {
      isNewValue:
        value.slice(0, selectionStart - 2) + value.slice(selectionEnd),
      isNewCursor: selectionStart - 2,
    };
  }

  if (
    key === "Delete" &&
    isNextCharSpace &&
    hasNoSelection &&
    selectionStart < value.length - 1
  ) {
    event.preventDefault();
    return {
      isNewValue:
        value.slice(0, selectionStart) + value.slice(selectionStart + 2),
      isNewCursor: selectionStart + 1,
    };
  }

  return { isNewValue: false, isNewCursor: false };
};

const adjustCursorPos = (
  selectionStart,
  rawValue,
  formattedValue,
  delimiterChar
) => {
  let newCursorPos = selectionStart;

  const rawCount =
    rawValue.slice(0, selectionStart).split(delimiterChar).length - 1;

  const formattedCount =
    formattedValue.slice(0, selectionStart).split(delimiterChar).length - 1;

  newCursorPos += formattedCount - rawCount;

  return newCursorPos;
};

const handleCardPasteFormat = (event, pasteData) => {
  const maxLength = 19;

  const { selectionStart, selectionEnd, value } = event.target;

  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);

  const combinedSanitized = sanitizeNumber(
    before + pasteData + after,
    maxLength
  );
  const beforePasteSanitized = sanitizeNumber(before + pasteData, maxLength);

  const formattedValue = updateCardInput(combinedSanitized);

  const cursorPos = updateCardInput(beforePasteSanitized).length;

  return { formattedValue, cursorPos };
};

inputCardNo.addEventListener("keydown", (event) => {
  const keyValidated = isKeyAllowed(event, true);
  if (!keyValidated) {
    event.preventDefault();
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    const { isNewValue, isNewCursor } = handleDelimiterBackspaceDelete(
      event,
      " "
    );
    if (isNewValue) {
      const formatValue = updateCardInput(isNewValue);

      event.target.value = formatValue;

      requestAnimationFrame(() => {
        event.target.setSelectionRange(isNewCursor, isNewCursor);
      });
    }
  }
});

inputCardNo.addEventListener("input", (event) => {
  const rawValue = event.target.value;

  const formatValue = updateCardInput(rawValue);

  const selectionStart = event.target.selectionStart;

  const cursorPos = adjustCursorPos(selectionStart, rawValue, formatValue, " ");

  event.target.value = formatValue;

  requestAnimationFrame(() => {
    event.target.setSelectionRange(cursorPos, cursorPos);
  });
});

inputCardNo.addEventListener("paste", (event) => {
  const regexNumberSpace = /[\d ]/;

  const pasteData = (event.clipboardData || window.clipboardData).getData(
    "text"
  );

  if (!regexNumberSpace.test(pasteData)) {
    event.preventDefault();
    return;
  }

  event.preventDefault();

  const { formattedValue, cursorPos } = handleCardPasteFormat(event, pasteData);

  event.target.value = formattedValue;

  requestAnimationFrame(() => {
    event.target.setSelectionRange(cursorPos, cursorPos);
  });
});

const cardHolderNameValid = (text) => {
  const regex = /^[\p{L}\p{M}\s'.-]{1,20}$/u;
  const fullName = text.trim();

  return regex.test(fullName);
};

inputCardHolderName.addEventListener("input", (event) => {
  const rawValue = event.target.value;

  const cleanValue = rawValue
    .normalize("NFD")
    .replace(/[^\p{L}\p{M}\s'.\u2019-]/gu, "")
    // .trim()
    .slice(0, 20);

  event.target.value = cleanValue;
});

const fixExpiryMonth = (month) => {
  if (month === "0" || month === "1") return month;

  const num = parseInt(month, 10);

  if (num < 1 || month === "00") return "01";
  if (num > 12) return "12";

  return String(num).padStart(2, "0");
};

const updateThruInput = (number) => {
  const sanitizedValue = sanitizeNumber(number, 4);

  if (sanitizedValue.length === 0) {
    return "";
  }

  const month = fixExpiryMonth(sanitizedValue.slice(0, 2));

  if (sanitizedValue.length <= 2) {
    return month;
  }

  const year = sanitizedValue.slice(2);

  return `${month}/${year}`;
};

inputCardThru.addEventListener("keydown", (event) => {
  const keyValidated = isKeyAllowed(event, false);
  if (!keyValidated) {
    event.preventDefault();
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    const { isNewValue, isNewCursor } = handleDelimiterBackspaceDelete(
      event,
      "/"
    );

    if (isNewValue) {
      const formatValue = updateThruInput(isNewValue);

      event.target.value = formatValue;

      requestAnimationFrame(() => {
        event.target.setSelectionRange(isNewCursor, isNewCursor);
      });
    }
  }
});

inputCardThru.addEventListener("input", (event) => {
  const rawValue = event.target.value;

  const formatValue = updateThruInput(rawValue);

  console.log("rawValue:" + rawValue);
  console.log("formatValue:" + formatValue);
  console.log("------------");

  event.target.value = formatValue;
});

inputCardCvv.addEventListener("keydown", (event) => {
  const keyValidated = isKeyAllowed(event, false);
  if (!keyValidated) {
    event.preventDefault();
    return;
  }
});

inputCardCvv.addEventListener("input", (event) => {
  const rawValue = event.target.value;

  event.target.placeholder = "*".repeat(cvcSize);

  const formatValue = sanitizeNumber(rawValue, cvcSize);

  event.target.value = formatValue;
});
