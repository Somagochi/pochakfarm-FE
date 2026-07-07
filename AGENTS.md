# AGENTS.md

## 프로젝트 설명

이 프로젝트는 React Native 앱 **포착팜**입니다.

포착팜은 사용자가 현실의 사진을 촬영하거나 업로드하면, AI가 사진 속 동물/사물을 인식하고, 배경을 제거한 뒤, 귀여운 농장 시뮬레이션 게임풍 픽셀 아트 개체로 변환해 저장/수집/농장 배치할 수 있는 앱입니다.

이 프로젝트는 **Feature-Sliced Design, FSD 아키텍처**를 따릅니다.

---

## 최상위 폴더 구조

src/ 아래에는 기본적으로 다음 6개의 폴더만 사용합니다.


src/
  app/
  screens/
  widgets/
  features/
  entities/
  shared/


불필요하게 components/, hooks/, utils/, services/, api/ 같은 최상위 폴더를 만들지 않습니다.

공통 컴포넌트는 shared/ui에 둡니다.
공통 훅/유틸은 shared/lib에 둡니다.
공통 API 클라이언트는 shared/api에 둡니다.

## 네이밍 규칙

### 케이스별 사용

| 대상 | 케이스 | 예시 | 이유 |
|------|--------|------|------|
| **Screens 폴더** | kebab-case | `capture-screen/`, `creature-detail-screen/` | 라우팅 화면 단위 |
| **Widgets 폴더** | kebab-case | `farm-field/`, `creature-collection-list/` | 큰 UI 블록 |
| **Features 폴더** | kebab-case | `create-creature-from-photo/`, `save-creature/` | 사용자 행동 단위 |
| **Entities 폴더** | kebab-case | `creature/`, `photo/` | 핵심 도메인 단위 |
| **React 컴포넌트** | PascalCase | `CaptureScreen.tsx`, `CreatureCard.tsx` | React 컴포넌트 컨벤션 |
| **훅 파일** | camelCase | `useCreateCreatureFromPhoto.ts` | use 접두사 |
| **함수/API 파일** | camelCase | `createCreatureFromPhotoApi.ts`, `validateImageFile.ts` | 함수명과 일치 |
| **타입 파일** | camelCase | `types.ts` | slice 내부 공통 타입 파일 |

### Screens 네이밍

```
패턴: screens/{screen-name}/ui/{PascalCase}Screen.tsx

올바른 예:
screens/capture-screen/ui/CaptureScreen.tsx
screens/creature-detail-screen/ui/CreatureDetailScreen.tsx

잘못된 예:
screens/captureScreen/        # camelCase
screens/CaptureScreen/        # PascalCase
screens/capture-screen/ui/CapturePage.tsx  # Screen 접미사가 아님
```

### Entities 네이밍

```
패턴: entities/{domain-name}/

올바른 예:
entities/creature/
entities/photo/
entities/farm/

잘못된 예:
entities/Creature/           # PascalCase
entities/creature-item/      # 도메인보다 UI 항목에 가까움
entities/creature_model/     # snake_case
```

### Features 네이밍

```
패턴: features/{user-action}/

올바른 예:
features/create-creature-from-photo/
features/save-creature/
features/rename-creature/

잘못된 예:
features/SaveCreature/       # PascalCase
features/save_creature/      # snake_case
features/creature-card/      # 도메인 UI라서 entities/creature/ui에 가까움
features/top-section/        # 화면 영역명이라 feature 이름으로 부적절
```

## 각 레이어의 역할


### app/

앱 전체 설정을 담당합니다.

예시:

src/app/
  navigation/
  providers/
  store/
  index.tsx

들어갈 수 있는 것:

네비게이션 설정
전역 Provider
앱 진입점
전역 상태 설정
React Query, Zustand 등 전역 설정

넣으면 안 되는 것: 

특정 기능의 비즈니스 로직
특정 화면 전용 UI
API 요청 로직


### screens/

실제 라우팅 단위의 화면을 담당합니다.

예시:

src/screens/
  home-screen/
  capture-screen/
  result-screen/
  collection-screen/
  farm-screen/
  creature-detail-screen/

screens는 주로 widgets, features, entities를 조합해서 화면을 구성합니다.

넣으면 안 되는 것:

직접 API 요청
복잡한 상태 관리
FormData 생성 같은 비즈니스 로직
AI 변환 흐름 같은 기능 로직

좋은 예시:

import { CreateCreatureButton } from '@/features/create-creature-from-photo';
import { CreatureCollectionList } from '@/widgets/creature-collection-list';

export function CollectionScreen() {
  return (
    <>
      <CreateCreatureButton />
      <CreatureCollectionList />
    </>
  );
}

나쁜 예시:

export function CaptureScreen() {
  async function handleConvert() {
    const formData = new FormData();
    await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });
  }

  return null;
}

이런 로직은 features/create-creature-from-photo 쪽으로 빼야 합니다.


### widgets/

여러 features, entities, shared를 조합한 큰 UI 블록을 담당합니다.

예시:

src/widgets/
  capture-processing-panel/
  creature-collection-list/
  farm-field/
  bottom-tab-bar/

예를 들어:

도감 리스트 영역
농장 필드 영역
촬영/변환 진행 패널
하단 탭바

같은 것들이 widgets에 들어갑니다.

widgets는 여러 기능과 도메인 UI를 조합할 수 있지만, 직접 서버 요청 로직을 가지는 것은 피합니다.


### features/

사용자가 수행하는 행동 단위의 기능을 담당합니다.

포착팜 기준 예시:

src/features/
  create-creature-from-photo/
  capture-photo/
  select-photo/
  detect-object/
  remove-background/
  convert-to-pixel-art/
  save-creature/
  place-creature/
  rename-creature/

MVP 단계에서는 너무 잘게 쪼개지 말고 아래처럼 넓게 잡아도 됩니다.

src/features/
  create-creature-from-photo/
  save-creature/
  place-creature/
  rename-creature/

feature는 화면 영역이 아니라 사용자 행동 기준으로 만듭니다.

좋은 feature 이름:

create-creature-from-photo
save-creature
place-creature
rename-creature
select-photo
capture-photo

나쁜 feature 이름:

main-button
top-section
card-list
blue-modal
capture-page-ui
feature 내부 구조

하나의 feature는 필요에 따라 다음 구조를 가질 수 있습니다.

src/features/some-feature/
  ui/
  model/
  api/
  lib/
  index.ts

모든 폴더를 무조건 만들 필요는 없습니다.
필요한 것만 만듭니다.

예시:

src/features/create-creature-from-photo/
  ui/
    CreateCreatureButton.tsx
    CreateCreatureProgress.tsx
  model/
    useCreateCreatureFromPhoto.ts
  api/
    createCreatureFromPhotoApi.ts
  lib/
    buildImageFormData.ts
    validateImageFile.ts
  index.ts
features/*/ui

해당 기능에서 사용하는 화면 컴포넌트를 둡니다.

예시:

ui/CreateCreatureButton.tsx
ui/CreateCreatureProgress.tsx
ui/RenameCreatureModal.tsx

ui 컴포넌트는 같은 feature의 model에 있는 훅을 사용할 수 있습니다.

import { Button } from '@/shared/ui/Button';
import { useCreateCreatureFromPhoto } from '../model/useCreateCreatureFromPhoto';

export function CreateCreatureButton() {
  const { createCreature, isLoading } = useCreateCreatureFromPhoto();

  return (
    <Button disabled={isLoading} onPress={createCreature}>
      {isLoading ? '생성 중...' : '포착하기'}
    </Button>
  );
}
features/*/model

해당 기능의 상태, 훅, 로직, 타입을 둡니다.

예시:

model/useCreateCreatureFromPhoto.ts
model/createCreatureFromPhotoStore.ts
model/types.ts

들어갈 수 있는 것:

React Hook
Zustand/Jotai/Redux store
loading/error 상태
기능 전용 타입
버튼을 눌렀을 때 실행되는 흐름

예시:

import { createCreatureFromPhotoApi } from '../api/createCreatureFromPhotoApi';

export function useCreateCreatureFromPhoto() {
  async function createCreature(photoUri: string) {
    return createCreatureFromPhotoApi(photoUri);
  }

  return {
    createCreature,
  };
}
features/*/api

해당 기능에서 사용하는 서버 요청 함수를 둡니다.

예시:

api/createCreatureFromPhotoApi.ts
api/saveCreatureApi.ts
api/renameCreatureApi.ts

API 파일은 보통 shared/api/client.ts의 공통 API 클라이언트를 사용합니다.

import { apiClient } from '@/shared/api/client';

export async function createCreatureFromPhotoApi(photoUri: string) {
  const formData = new FormData();

  formData.append('image', {
    uri: photoUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as any);

  const response = await apiClient.post('/creatures/from-photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

api 폴더에는 UI 로직을 넣지 않습니다.

features/*/lib

해당 feature 내부에서만 쓰는 유틸 함수를 둡니다.

예시:

lib/validateImageFile.ts
lib/buildImageFormData.ts
lib/buildPixelPrompt.ts

여러 feature에서 재사용된다면 shared/lib으로 이동합니다.

features/*/index.ts

해당 feature의 외부 공개용 export 파일입니다.

다른 레이어에서 사용할 것만 export합니다.

export { CreateCreatureButton } from './ui/CreateCreatureButton';
export { CreateCreatureProgress } from './ui/CreateCreatureProgress';
export { useCreateCreatureFromPhoto } from './model/useCreateCreatureFromPhoto';

다른 곳에서는 feature 내부 파일을 직접 깊게 import하지 말고, feature 루트에서 import합니다.

좋은 예시:

import { CreateCreatureButton } from '@/features/create-creature-from-photo';

나쁜 예시:

import { CreateCreatureButton } from '@/features/create-creature-from-photo/ui/CreateCreatureButton';
entities/

앱의 핵심 도메인 데이터를 담당합니다.

포착팜 기준 예시:

src/entities/
  creature/
  photo/
  user/
  farm/
  collection/

entities에는 도메인 타입, 도메인 API, 도메인 UI가 들어갈 수 있습니다.

예시:

src/entities/creature/
  ui/
    CreatureCard.tsx
    CreatureImage.tsx
    CreatureStatList.tsx
  model/
    types.ts
  api/
    creatureApi.ts
  lib/
    calculateCreatureRarity.ts
  index.ts

좋은 예시:

entities/creature/ui/CreatureCard.tsx
entities/creature/model/types.ts

나쁜 예시:

entities/creature/ui/SaveCreatureButton.tsx
entities/creature/model/useRenameCreature.ts

SaveCreatureButton, useRenameCreature는 사용자의 행동이므로 features에 둡니다.

### shared/

특정 도메인이나 기능에 종속되지 않는 공통 코드를 담당합니다.

예시:

src/shared/
  ui/
    Button.tsx
    Modal.tsx
    Loading.tsx
  api/
    client.ts
  config/
    env.ts
    routes.ts
  lib/
    image/
      resizeImage.ts
      compressImage.ts
  assets/
    icons/
    images/

shared는 가장 아래 레이어입니다.
따라서 features, entities, widgets, screens를 import하면 안 됩니다.

### import 규칙

의존성 방향은 아래처럼 유지합니다.

app
  -> screens
    -> widgets
      -> features
        -> entities
          -> shared

낮은 레이어가 높은 레이어를 import하면 안 됩니다.

허용:

import { Button } from '@/shared/ui/Button';
import { CreatureCard } from '@/entities/creature';
import { SaveCreatureButton } from '@/features/save-creature';

금지:

// shared가 entity를 알면 안 됨
import { Creature } from '@/entities/creature';

// entity가 feature를 알면 안 됨
import { useSaveCreature } from '@/features/save-creature';

// feature가 widget을 알면 안 됨
import { FarmField } from '@/widgets/farm-field';
이름 규칙

폴더 이름은 kebab-case를 사용합니다.

좋은 예시:

create-creature-from-photo
save-creature
place-creature
creature-detail-screen

나쁜 예시:

createCreatureFromPhoto
SaveCreature
Place_Creature

React 컴포넌트 파일은 PascalCase를 사용합니다.

CreateCreatureButton.tsx
CreatureCard.tsx
FarmScreen.tsx

훅, 함수, API 파일은 camelCase를 사용합니다.

useCreateCreatureFromPhoto.ts
createCreatureFromPhotoApi.ts
validateImageFile.ts
포착팜 MVP 추천 구조
src/
  app/
    navigation/
      AppNavigator.tsx
    providers/
      QueryProvider.tsx
    index.tsx

  screens/
    capture-screen/
      ui/
        CaptureScreen.tsx
      index.ts

    result-screen/
      ui/
        ResultScreen.tsx
      index.ts

    collection-screen/
      ui/
        CollectionScreen.tsx
      index.ts

    farm-screen/
      ui/
        FarmScreen.tsx
      index.ts

  widgets/
    capture-processing-panel/
      ui/
        CaptureProcessingPanel.tsx
      index.ts

    creature-collection-list/
      ui/
        CreatureCollectionList.tsx
      index.ts

    farm-field/
      ui/
        FarmField.tsx
      index.ts

  features/
    create-creature-from-photo/
      ui/
        CreateCreatureButton.tsx
        CreateCreatureProgress.tsx
      model/
        useCreateCreatureFromPhoto.ts
      api/
        createCreatureFromPhotoApi.ts
      lib/
        buildImageFormData.ts
        validateImageFile.ts
      index.ts

    save-creature/
      ui/
        SaveCreatureButton.tsx
      model/
        useSaveCreature.ts
      api/
        saveCreatureApi.ts
      index.ts

    place-creature/
      model/
        usePlaceCreature.ts
      index.ts

    rename-creature/
      ui/
        RenameCreatureModal.tsx
      model/
        useRenameCreature.ts
      api/
        renameCreatureApi.ts
      index.ts

  entities/
    creature/
      ui/
        CreatureCard.tsx
        CreatureImage.tsx
        CreatureStatList.tsx
      model/
        types.ts
      api/
        creatureApi.ts
      lib/
        calculateCreatureRarity.ts
      index.ts

    photo/
      model/
        types.ts
      index.ts

    farm/
      model/
        types.ts
      index.ts

    user/
      model/
        types.ts
      index.ts

  shared/
    ui/
      Button.tsx
      Modal.tsx
      Loading.tsx
    api/
      client.ts
    config/
      env.ts
      routes.ts
    lib/
      image/
        resizeImage.ts
        compressImage.ts


### 작업 전 판단 기준

파일을 만들기 전에 아래 기준으로 위치를 정합니다.

사용자가 직접 수행하는 행동인가?
  예 -> features

앱의 핵심 도메인 데이터인가?
  예 -> entities

여러 기능/도메인을 조합한 큰 UI인가?
  예 -> widgets

실제 화면 단위인가?
  예 -> screens

특정 기능이나 도메인과 무관한 공통 코드인가?
  예 -> shared
금지 사항

모든 컴포넌트를 components/에 몰아넣지 않습니다.

나쁜 예시:

src/components/
  Button.tsx
  CreatureCard.tsx
  CaptureScreen.tsx
  SaveCreatureButton.tsx
  useCreateCreature.ts
  creatureApi.ts

화면 파일 안에 API 요청이나 비즈니스 로직을 직접 작성하지 않습니다.

나쁜 예시:

export function CaptureScreen() {
  async function handlePress() {
    const formData = new FormData();
    await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });
  }

  return null;
}

feature 내부 파일을 외부에서 직접 깊게 import하지 않습니다.

나쁜 예시:

import { useCreateCreatureFromPhoto } from '@/features/create-creature-from-photo/model/useCreateCreatureFromPhoto';

좋은 예시:

import { useCreateCreatureFromPhoto } from '@/features/create-creature-from-photo';


### 작업 완료 전 체크리스트

작업을 마치기 전에 아래 항목을 스스로 검사합니다.

사용자 행동은 features에 들어갔는가?
핵심 도메인 객체는 entities에 들어갔는가?
화면 파일에 API 요청이나 복잡한 로직이 들어가지 않았는가?
외부 import는 각 slice의 index.ts를 통해 이루어지는가?
API 요청은 api 폴더에 있는가?
상태와 훅은 model 폴더에 있는가?
공통 컴포넌트와 유틸은 shared에 있는가?
components/ 폴더에 모든 것을 몰아넣지 않았는가?

## PR문서 작성해달라고 할 때

루트에있는 convention_template보고 만들어. 깃허브 웹사이트에 붙여넣을 수 있게 만들어줘.

## 커밋 작성해달라고 할 때 

하나로 퉁쳐서 커밋작성하지말고 각각 모든 내용 다 한국어로 작성해줘

## 커밋 템플릿

################
<타입> : <제목> 의 형식으로 제목을 아래 공백줄에 작성
제목은 50자 이내 / 변경사항이 "무엇"인지 명확히 작성 / 끝에 마침표 금지
예) feat : 로그인 기능 추가

바로 아래 공백은 지우지 마세요 (제목과 본문의 분리를 위함)

################
본문(구체적인 내용)을 아랫줄에 작성
여러 줄의 메시지를 작성할 땐 "-"로 구분 (한 줄은 72자 이내)

################
꼬릿말(footer)을 아랫줄에 작성 (현재 커밋과 관련된 이슈 번호 추가 등)
예) Close #7

################
- ✨ `feat` : 새로운 기능 구현
- 🐛 `fix` : 코드 수정, 버그/오류 해결
- 📦 `chore` : 동작에 영향 없는 코드 or 변경 없는 변경 사항(주석 추가 등)
- 📝 `docs` : README 등의 문서 수정
- 🚀 `deploy`: 배포 관련
- 💄 `style` : 디자인 관련
- ♻️ `refactor` : 전면 수정, 코드 리팩토링
- ✅ `test`: 테스트 추가/수정
################