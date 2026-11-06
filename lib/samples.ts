// 체험용 샘플 계약서 (public/samples). 업로드 화면에서 하나를 골라 점검해 본다.
// 실제 계약서를 넣을 때는 이름, 연락처, 주소, 주민번호, 계좌, 서명, 가게 이름·대표자처럼 사람이나 가게를 알아볼 수 있는 곳을 가린다.
// 이 파일은 누구나 내려받을 수 있다. 한 장에 1~2MB 이하로 줄여서 넣는다.
export type SampleId = "pharmacy" | "academy" | "tutoring" | "restaurant" | "harucoffee" | "moabooks";

export type Sample = {
  id: SampleId;
  name: string; // 썸네일 아래 이름. 업종만 쓰고 가게 이름이나 점검 결과는 미리 말하지 않는다
  pages: string[]; // 계약서 장 순서대로. 최대 2장 (업로드 한도와 같다)
};

// 앞의 넷은 팀원이 실제로 받은 계약서다 (주민등록번호·주소·연락처는 가렸고, 사진의 위치 정보는 지웠다).
// 뒤의 둘은 테스트용으로 만든 가상 계약서다.
export const SAMPLES: Sample[] = [
  { id: "pharmacy", name: "약국 알바", pages: ["/samples/pharmacy-1.jpg", "/samples/pharmacy-2.jpg"] },
  { id: "academy", name: "학원 강사", pages: ["/samples/academy-1.jpg", "/samples/academy-2.jpg"] },
  { id: "tutoring", name: "학원 보조", pages: ["/samples/tutoring-1.jpg"] },
  { id: "restaurant", name: "레스토랑 일용직", pages: ["/samples/restaurant-1.jpg"] },
  {
    id: "harucoffee",
    name: "카페 알바",
    pages: ["/samples/sample-contract.png"],
  },
  {
    id: "moabooks",
    name: "서점 알바",
    pages: ["/samples/sample-moabooks.png"],
  },
];

export const FIRST_SAMPLE: SampleId = SAMPLES[0].id;
