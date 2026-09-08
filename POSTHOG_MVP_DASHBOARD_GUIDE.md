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

