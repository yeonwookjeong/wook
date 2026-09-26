// Business details the law (전자상거래법 제10조) and the card-company review require on every page footer.
export const BUSINESS = {
  name: "조이헌트", // 상호
  ceo: "정연욱", // 대표자
  regNo: "274-72-00461", // 사업자등록번호
  mailOrderNo: "2024-경기파주-0357", // 통신판매업 신고번호
  address: "경기도 파주시 교하로159번길 33, 304호 -C152", // 사업장 주소
  phone: "070-4578-4984", // 전화 (자동응답: 문의는 이메일로 안내)
  email: "jyu1101@gmail.com", // 이메일
  hosting: "Vercel Inc.", // 호스팅 서비스 제공자
};

export const hasBusinessInfo = () => Boolean(BUSINESS.name && BUSINESS.regNo && BUSINESS.mailOrderNo);

// 공정거래위원회 사업자정보 확인 (the link the law asks mail-order sellers to show next to their details).
export const ftcLookupUrl = () => `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${BUSINESS.regNo.replace(/\D/g, "")}`;
