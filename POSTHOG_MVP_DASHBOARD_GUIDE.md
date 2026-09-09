# PostHog MVP 대시보드 만들기

## 시작 전에

앱에서 테스트 행동을 한 번씩 수행한 뒤 PostHog의 `Activity` 또는
`Data management > Events`에서 아래 이벤트가 들어오는지 확인한다.

```text
signup_completed
capture_started
capture_generation_completed
capture_saved
capture_discarded
capture_failed
battle_started
battle_completed
farm_creature_moved
achievement_claimed
request_failed
```

모든 차트는 다음 순서로 만든다.

1. 왼쪽 `Dashboards`를 누른다.
2. `New dashboard`를 누른다.
3. `Blank dashboard`를 선택하고 아래 안내의 대시보드 이름을 입력한다.
4. 대시보드 우측 위 `Add insight`를 누른다.
5. 안내된 Insight 종류와 이벤트를 선택한다.
6. 차트 이름을 입력하고 `Save & add to dashboard`를 누른다.

## 이벤트별 정확한 수집 시점

### `signup_completed`

- 신규 가입 약관 화면에서 필수 약관에 동의하고 `가입 완료`를 누른다.
- `POST /api/users/me/terms-agreement` 요청이 성공한 직후 수집된다.
- 서버 요청이 실패하면 수집되지 않는다.
- 선택 약관 동의 여부가 `marketing_agreed`, `service_quality_agreed`로 함께 수집된다.

### `capture_started`

- 카메라로 촬영하거나 앨범에서 사진을 선택하고 동물 이름을 확정한다.
- 포착 생성 흐름이 시작되어 `POST /api/captures`를 보내기 직전에 수집된다.
- 요청 시도 자체를 나타내므로 이후 서버 요청이나 업로드가 실패해도 수집된다.
- 이미 포착 요청을 처리 중일 때 발생한 중복 입력에서는 수집되지 않는다.
- 이미지 형식과 코인 기회 사용 여부가 `content_type`, `paid_attempt`로 수집된다.

### `capture_generation_completed`

- 포착 미니게임 결과가 서버에 제출된 후 카드 생성 상태 polling을 시작한다.
- `GET /api/captures/:id` 응답의 `generationStatus`가 `SUCCEEDED`가 되고,
  유효한 카드 이미지 결과까지 확인된 순간 수집된다.
- 미니게임 성공 후 AI 카드 생성까지 완료되어야 하므로 사진 업로드 성공만으로는
  수집되지 않는다.
- 카드 티어, 카드 환경, 앱 측 대기 시간, 서버 처리 시간이 함께 수집된다.

### `capture_saved`

- 생성된 카드 결과에서 `농장에 저장하기`를 선택한다.
- 저장할 빈 슬롯 또는 교체할 슬롯을 선택하고 최종 확인한다.
- `POST /api/captures/:id/animal` 배치 API가 성공한 직후 수집된다.
- 저장 확인 모달을 열거나 슬롯만 선택한 상태에서는 수집되지 않는다.
- 저장 층, 슬롯, 기존 동물 교체 여부가 함께 수집된다.

### `capture_discarded`

- 생성된 카드 결과에서 `자연으로 돌려보내기`를 선택한다.
- 경고창에서 최종 확인 버튼을 누르는 순간 수집된다.
- 경고창을 열었다가 취소하면 수집되지 않는다.
- 이 흐름에는 별도 서버 방생 API가 없으므로 최종 확인 행동을 완료 기준으로 삼는다.
- capture ID, 카드 환경, 티어가 함께 수집된다.

### `capture_failed`

다음 중 하나가 발생하면 수집된다.

- `step = create`: 포착 생성 API 단계에서 실패
- `step = upload`: Presigned URL에 원본 이미지를 업로드하다 실패
- `step = upload_complete`: 원본 이미지 업로드 완료 API가 실패
- `step = generation`: 서버가 카드 생성 상태를 명시적으로 `FAILED`로 반환
- `step = game_result_or_generation`: 미니게임 결과 제출, 생성 상태 조회,
  생성 결과 검증 중 예외 발생

사용자의 미니게임 실패 자체는 정상 게임 결과이므로 `capture_failed`가 아니다.
`capture_failed`는 포착 처리 요청이나 카드 생성 과정의 기술적 실패를 의미한다.

### `battle_started`

- 관장을 선택하고 출전 동물 3마리를 구성한 뒤 대전 시작 버튼을 누른다.
- `POST /api/battles`로 대전 생성에 성공한다.
- 이어서 생성된 battle ID로 초기 배틀 상태 조회까지 성공한 직후 수집된다.
- 버튼만 누르거나 대전 생성/초기 상태 조회가 실패하면 수집되지 않는다.
- battle ID, 관장 ID, 파티 인원이 함께 수집된다.

### `battle_completed`

- 배틀 서버 상태가 종료되어 `/battle-result` 결과 화면으로 이동한다.
- 결과 화면에 유효한 battle ID가 전달되고 처음 표시되는 순간 한 번 수집된다.
- 일반 배틀 종료, 최종 라운드 종료, 앱 재실행 후 완료 배틀 복구 모두 포함한다.
- 결과 화면이 유효한 battle ID 없이 열리면 수집되지 않는다.
- 승패, 관장 ID, 첫 클리어 여부, 코인·경험치 보상이 함께 수집된다.

### `farm_creature_moved`

- 농장에서 동물 재배치 모드로 들어가 동물을 다른 슬롯으로 드래그한다.
- `PATCH /api/animals/:id/slot` 이동 API가 성공한 직후 수집된다.
- 드래그를 시작만 하거나 원래 슬롯에 놓거나 API가 실패하면 수집되지 않는다.
- 동물 ID와 이동한 목적지 층·슬롯이 함께 수집된다.

### `achievement_claimed`

- 도감의 업적에서 수령 가능한 보상 버튼을 누른다.
- `POST /api/achievements/:code/claim` 요청이 성공한 직후 수집된다.
- 이미 수령 중인 중복 입력이나 서버 요청 실패에서는 수집되지 않는다.
- 업적 문자열 원문이 아니라 서버에서 정한 `achievement_code`가 함께 수집된다.

### `request_failed`

- 공통 `apiClient`를 이용한 모든 API 요청에서 예외가 발생하면 자동 수집된다.
- HTTP 응답이 `4xx` 또는 `5xx`인 경우가 포함된다.
- 네트워크 연결 실패, API 주소 미설정, 인증 token 처리 실패도 포함된다.
- 인증 만료로 401을 받고 token 갱신 후 재요청까지 성공하면 수집되지 않는다.
- token 갱신 또는 재요청도 최종 실패하면 원래 요청 endpoint의 실패로 수집된다.
- Presigned URL에 이미지를 올리는 외부 `fetch`는 공통 `apiClient`를 사용하지 않으므로
  `request_failed`에는 포함되지 않고 `capture_failed(step = upload)`로만 수집된다.
- endpoint의 숫자 ID, achievement code, query string은 제거 또는 치환한 뒤 전송된다.
- method, status, error code, 오류 범주, 소요 시간이 함께 수집된다.

### 한 행동에서 이벤트가 함께 발생하는 경우

- 포착 생성 API 실패: `capture_started` → `request_failed` → `capture_failed`
- 카드 생성 상태 조회 API 실패: `request_failed` → `capture_failed`
- 카드 저장 API 실패: `request_failed`만 수집되고 `capture_saved`는 수집되지 않는다.
- 배틀 생성 API 실패: `request_failed`만 수집되고 `battle_started`는 수집되지 않는다.
- 업적 수령 API 실패: `request_failed`만 수집되고 `achievement_claimed`는 수집되지 않는다.

## 1. 핵심 활성화·포착 퍼널

대시보드 이름: `01. 핵심 활성화·포착 퍼널`

### 차트 A: 가입 후 첫 포착 저장 전환율

1. Insight 종류에서 `Funnels`를 선택한다.
2. Step을 다음 순서로 추가한다.
   - `signup_completed`
   - `capture_started`
   - `capture_generation_completed`
   - `capture_saved`
3. `Conversion window`를 `7 days`로 설정한다.
4. 집계 기준은 `Unique users`를 선택한다.
5. 이름을 `가입 후 7일 내 첫 포착 저장 전환율`로 저장한다.

단계 사이의 감소 폭이 가장 큰 곳이 우선 개선 지점이다.

### 차트 B: 전체 포착 성공·실패 추세

1. `Trends`를 선택한다.
2. Series에 다음 이벤트를 각각 추가한다.
   - `capture_generation_completed`
   - `capture_failed`
3. 각 Series 집계를 `Total count`로 설정한다.
4. 기간은 `Last 30 days`, 간격은 `Day`로 설정한다.
5. 이름을 `일별 포착 생성 성공·실패`로 저장한다.

### 차트 C: 생성 속도

1. `Trends`를 선택하고 `capture_generation_completed`를 추가한다.
2. 집계 방식에서 event property의 `duration_ms` 평균을 선택한다.
3. 같은 이벤트를 하나 더 추가하고 `server_elapsed_ms` 평균을 선택한다.
4. 이름을 `포착 생성 평균 소요시간`으로 저장한다.

### 차트 D: 저장과 방생 선택

1. `Trends`에 `capture_saved`, `capture_discarded`를 추가한다.
2. 집계는 각각 `Unique users`로 설정한다.
3. 이름을 `카드 저장·방생 사용자`로 저장한다.

## 2. 활성 사용자·리텐션

대시보드 이름: `02. 활성 사용자·리텐션`

### 먼저 Core Gameplay Action 만들기

1. `Data management > Actions`로 이동한다.
2. `New action`을 누른다.
3. 이름을 `Core Gameplay`로 입력한다.
4. 아래 custom event를 같은 Action의 match group으로 추가한다.
   - `capture_saved`
   - `battle_completed`
   - `farm_creature_moved`
   - `achievement_claimed`
5. 저장한다.

Action은 여러 핵심 행동을 하나의 지표처럼 묶어준다.

### 차트 A: DAU

1. `Trends`에서 `Core Gameplay` Action을 선택한다.
2. 집계를 `Daily active users`로 선택한다.
3. 기간은 `Last 30 days`, 간격은 `Day`로 설정한다.
4. 이름을 `제품 DAU`로 저장한다.

### 차트 B: WAU

1. `Trends`에서 `Core Gameplay`를 선택한다.
2. 집계는 `Unique users`, 간격은 `Week`로 설정한다.
3. 기간은 `Last 12 weeks`로 설정한다.
4. 이름을 `제품 WAU`로 저장한다.

### 차트 C: MAU

1. `Trends`에서 `Core Gameplay`를 선택한다.
2. 집계는 `Unique users`, 간격은 `Month`로 설정한다.
3. 기간은 최근 6개월 이상으로 설정한다.
4. 이름을 `제품 MAU`로 저장한다.

초기에는 달력 월 기준 MAU를 사용한다. rolling 30일 MAU와 혼용하지 않는다.

### 차트 D: 첫 포착 이후 주간 리텐션

1. `Retention`을 선택한다.
2. Start event에 `capture_saved`를 선택한다.
3. Return event에 `Core Gameplay`를 선택한다.
4. `First time` 기준, 기간 단위는 `Week`로 설정한다.
5. 조회 기간은 최근 12주로 설정한다.
6. 이름을 `첫 포착 저장 후 주간 리텐션`으로 저장한다.

Week 1 숫자 하나보다 여러 주가 지나도 곡선이 0 위에서 유지되는지 본다.

## 3. 기능별 사용 현황

대시보드 이름: `03. 기능별 사용 현황`

이 대시보드는 사용자가 앱에 들어왔다는 사실이 아니라 **어떤 핵심 콘텐츠에서 실제
행동을 완료했는지** 비교하기 위해 사용한다. 기능별 이용자 수와 반복 횟수를 함께
보면 신규 기능 개발, 기존 기능 개선, 운영 콘텐츠 배치의 우선순위를 정할 수 있다.

### 각 데이터를 수집하는 이유

- **포착 저장 사용자 수**
  - 현실의 사진을 카드로 만들고 농장에 저장하는 핵심 가치를 실제로 경험한 사용자
    규모를 확인한다.
  - 포착 시작 수가 많아도 저장 사용자 수가 적다면 생성 결과, 저장 과정 또는 농장
    공간에서 문제가 있는 것으로 볼 수 있다.
  - 포착팜의 북극성 지표이므로 다른 기능 사용량을 판단하는 기준선으로 사용한다.
- **배틀 완료 사용자 수**
  - 수집한 동물이 실제 플레이 콘텐츠인 배틀로 이어지는지 확인한다.
  - `battle_started`가 아니라 완료 사용자를 세어 덱만 구성하고 이탈한 사용자를
    활성 사용자로 과대평가하지 않는다.
  - 포착 사용자 대비 배틀 완료 사용자가 적으면 배틀 진입 조건, 난이도, 보상 또는
    배틀 발견 경로를 개선할 근거가 된다.
- **농장 재배치 사용자 수**
  - 사용자가 농장을 단순 조회하는 것을 넘어 자신만의 공간을 꾸미고 관리하는지
    확인한다.
  - 재배치는 수집한 동물에 애착을 갖고 반복 방문할 가능성을 보여주는 참여 지표다.
  - 사용률이 낮으면 재배치 기능의 발견 가능성이나 조작 편의성을 점검한다.
- **업적 보상 수령 사용자 수**
  - 사용자가 장기 목표와 보상 구조를 인지하고 참여하는지 확인한다.
  - 달성된 업적이 많아도 수령 사용자가 적으면 도감 진입 경로, 보상 알림 또는 수령
    UI가 잘 보이지 않는 문제일 수 있다.
  - 어떤 `achievement_code`가 많이 수령되는지 보면 목표 난이도와 보상 배치를
    조정할 수 있다.
- **사용자당 주간 수행 횟수**
  - 기능을 한 번 체험한 사용자 수와 반복해서 사용하는 사용자를 구분한다.
  - 고유 사용자는 증가하지만 사용자당 횟수가 낮으면 기능 발견은 잘되지만 반복할
    동기가 약한 상태일 수 있다.
  - 사용자 수는 적어도 반복 횟수가 높으면 충성 사용자가 강하게 사용하는 기능이므로
    제거보다 진입 경로 확대를 검토할 수 있다.

### 차트 A: 핵심 기능별 사용자 수

1. `Trends`를 선택한다.
2. 다음 이벤트를 Series로 추가한다.
   - `capture_saved`
   - `battle_completed`
   - `farm_creature_moved`
   - `achievement_claimed`
3. 모든 Series를 `Unique users`로 설정한다.
4. 기간은 `Last 12 weeks`, 간격은 `Week`로 설정한다.
5. 이름을 `주간 핵심 기능별 사용자`로 저장한다.

기능 간 절대 사용자 수와 시간에 따른 증가·감소를 비교한다.

### 차트 B: 기능별 총 사용량

1. 차트 A를 Duplicate한다.
2. 모든 Series의 집계를 `Total count`로 변경한다.
3. 이름을 `주간 핵심 기능별 총 사용량`으로 저장한다.

고유 사용자는 그대로인데 총 사용량이 증가하면 기존 사용자의 반복 사용이 늘어난
것이다.

### 차트 C: 핵심 행동 고착도

1. `Stickiness`를 선택한다.
2. 이벤트로 `Core Gameplay`를 선택한다.
3. 기간을 최근 30일로 설정한다.
4. 이름을 `최근 30일 핵심 행동 수행 일수`로 저장한다.

가로축에서 1일 사용자만 많은지, 여러 날 반복하는 사용자 비중이 커지는지 본다.

### 차트 D: 배틀 완료율

1. `Funnels`를 선택한다.
2. `battle_started` → `battle_completed` 순서로 추가한다.
3. Conversion window를 `1 day`로 설정한다.
4. 이름을 `배틀 시작 대비 완료율`로 저장한다.

## 4. 오류·성능

대시보드 이름: `04. 오류·성능`

이 대시보드는 기능 퍼널의 이탈이 사용자의 자발적인 선택인지, API 오류나 긴 대기
시간 때문에 완료하지 못한 것인지 구분하기 위해 사용한다. 오류의 총횟수만 보지 않고
영향받은 사용자, 실패율, 앱 버전, 처리 시간을 함께 봐야 수정 우선순위를 정할 수
있다.

### 각 데이터를 수집하는 이유

- **기능별 API 실패율**
  - 요청량이 많은 기능은 실패 건수도 자연스럽게 많으므로 실패 개수가 아닌
    `실패 요청 / 전체 요청` 비율로 기능의 안정성을 비교한다.
  - 포착, 배틀, 농장 등 어느 기능이 사용자의 완료를 가장 자주 막는지 찾아 장애와
    개선 작업의 우선순위를 정한다.
  - `endpoint`, `status`, `error_category`로 나누면 서버 오류, 잘못된 사용자
    상태 또는 네트워크 문제를 구분하기 쉽다.
- **포착 생성 실패율**
  - 포착은 사진 업로드와 AI 카드 생성이라는 비용이 크고 대기 시간이 긴 핵심
    기능이므로 별도로 관리한다.
  - `capture_failed / capture_started` 비율과 `step`을 함께 보면 생성 요청,
    이미지 업로드, 업로드 완료 처리, 게임 결과 제출, AI 생성 중 어디서 실패하는지
    알 수 있다.
  - 실패율 상승은 사용자 경험뿐 아니라 재시도에 따른 서버 및 AI 처리 비용 증가도
    의미한다.
- **포착 생성 시간**
  - 성공하더라도 생성 시간이 길면 사용자가 기다리지 않고 앱을 종료할 수 있다.
  - 앱에서 측정한 `duration_ms`와 서버가 제공한 `server_elapsed_ms`를 비교하면 서버
    처리 지연과 네트워크·polling 대기 시간을 구분할 수 있다.
  - 평균값만 보면 일부 매우 느린 요청이 가려질 수 있으므로 가능하면 p50과 p95를
    함께 확인한다.
- **앱 버전별 오류 사용자 수**
  - 새 버전 배포 뒤 특정 버전에서만 발생한 회귀 오류를 빠르게 찾는다.
  - 전체 오류 건수뿐 아니라 `request_failed`를 경험한 고유 사용자 수를 보면 실제
    영향 범위를 판단할 수 있다.
  - 구버전 문제라면 업데이트 유도, 최신 버전 문제라면 핫픽스나 배포 중단처럼 서로
    다른 대응을 선택할 수 있다.

> 현재 수집하는 `request_failed`만으로는 실패 건수와 오류 경험 사용자 수를 볼 수
> 있지만, 모든 API의 정확한 실패율을 계산할 분모는 없다. 진짜
> `실패 요청 / 전체 요청` 비율이 필요해지면 성공 요청도 집계하는
> `request_completed`를 추가하거나 서버 요청 로그를 PostHog와 연결해야 한다.

### 차트 A: 실패 요청 추세

1. `Trends`에서 `request_failed`를 선택한다.
2. 집계를 `Total count`로 설정한다.
3. `Breakdown`에 event property `endpoint`를 선택한다.
4. 기간은 `Last 7 days`, 간격은 `Day`로 설정한다.
5. 이름을 `endpoint별 요청 실패`로 저장한다.

### 차트 B: 오류 영향 사용자 수

1. 차트 A를 Duplicate한다.
2. 집계를 `Unique users`로 바꾼다.
3. 이름을 `endpoint별 오류 경험 사용자`로 저장한다.

두 차트를 같이 봐야 한 사용자의 반복 재시도로 오류가 과장되는 것을 피할 수 있다.

### 차트 C: 상태 코드별 오류

1. `Trends`에서 `request_failed`를 선택한다.
2. `Breakdown`에 `status`를 선택한다.
3. 이름을 `HTTP 상태별 요청 실패`로 저장한다.

- `4xx`: 사용자 상태나 요청 조건 문제일 가능성이 큼
- `5xx`: 서버 문제일 가능성이 큼
- `status = null`: 네트워크 또는 앱 내부 요청 준비 오류일 가능성이 큼

### 차트 D: 포착 실패 단계

1. `Trends`에서 `capture_failed`를 선택한다.
2. 집계는 `Total count`로 설정한다.
3. `Breakdown`에 `step`을 선택한다.
4. 이름을 `단계별 포착 실패`로 저장한다.

`create`, `upload`, `upload_complete`, `generation`,
`game_result_or_generation` 중 어느 단계가 가장 자주 실패하는지 본다.

## 데이터 확인 주기

- 매일: 오류·성능 대시보드
- 매주: 포착 퍼널, DAU/WAU, 기능별 사용자
- 매월: MAU, 주간 리텐션, 기능 고착도
- 배포 직후: 대시보드 날짜를 배포 전후로 나누고 app version breakdown 확인

표본이 매우 적을 때는 전환율을 결론으로 단정하지 않는다. 최소 2~4주 데이터를
모은 후 추세를 기준으로 판단한다.
