"use strict";

function classifySyntheticPaymentScreenshot(meta) {
  const containsVictimName = Boolean(meta && meta.containsVictimName);
  const containsFullCard = Boolean(meta && meta.containsFullCard);
  const privacy_class =
    containsVictimName || containsFullCard ? "P2" : "P1";
  return {
    privacy_class,
    public: {
      amount: meta.amount,
      date: meta.date,
      method: meta.method,
    },
    never_public: ["victim_name", "full_card_number", "storage_key"],
  };
}

module.exports = { classifySyntheticPaymentScreenshot };
