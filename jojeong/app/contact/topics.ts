// What people write in about, and the lines that help an answer (the refund needs the payment, a lost link
// needs the name on the report).
export const INQUIRY_TOPICS = [
  {
    key: "결제·환불",
    desc: "결제가 됐는데 보고서가 안 열리거나, 환불을 원하실 때",
    body: ["결제일:", "결제 금액:", "보고서 이름:", "결제 수단(카드사 등):", "요청 내용:"],
  },
  {
    key: "보고서 링크 분실",
    desc: "보고서 링크를 잃어버렸거나 다른 기기에서 보고 싶을 때",
    body: ["결제일:", "결제 금액:", "보고서 이름:", "받는 분 이름(보고서에 적힌 이름):"],
  },
  {
    key: "오류 신고",
    desc: "화면이 이상하거나 결과가 나오지 않을 때",
    body: ["어느 화면에서:", "무엇을 눌렀을 때:", "휴대폰/브라우저 종류:"],
  },
  {
    key: "기타·제휴",
    desc: "그 밖의 문의, 제안, 제휴",
    body: ["문의 내용:"],
  },
] as const;
