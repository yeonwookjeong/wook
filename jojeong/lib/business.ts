// Business details the law (전자상거래법) and the card-company review require on every page footer.
// Fill these in before opening payments; while they are empty the footer says so instead of showing blanks.
export const BUSINESS = {
  name: "", // 상호
  ceo: "", // 대표자
  regNo: "", // 사업자등록번호
  mailOrderNo: "", // 통신판매업 신고번호
  address: "", // 사업장 주소
  phone: "", // 전화
  email: "", // 이메일
  hosting: "Vercel Inc.", // 호스팅 서비스 제공자
};

export const hasBusinessInfo = () => Boolean(BUSINESS.name && BUSINESS.regNo && BUSINESS.mailOrderNo);
