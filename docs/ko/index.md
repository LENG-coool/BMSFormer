# 임베디드 시스템을 위한 경량 리튬배터리 SOH 추정: BMSFormer의 설계와 응용
## 서론{#引言}
전기차, 항공우주 등 분야에서 **리튬배터리의 건강 상태(SOH) 추정**은 시스템 안전을 보장하는 핵심입니다. 그러나 기존 배터리 관리 시스템은 “정확도와 효율의 딜레마”에 직면합니다.

- 딥러닝 모델: 높은 예측 정확도를 제공하지만 계산 복잡도가 커서 자원 제약이 큰 임베디드 장치에서 실행하기 어렵습니다.
- 전통 모델: 계산 부담은 작지만, 복잡한 비선형 열화를 다룰 때 정확도가 만족스럽지 않은 경우가 많습니다.

최근 《*Energy*》에 게재된 논문 「***BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator***」는 **BMSFormer**라는 경량 딥러닝 모델을 제안하여, 계산 효율과 예측 정확도의 균형을 통해 배터리 온라인 모니터링에 새로운 해법을 제시합니다.

## SOH 추정 방법{#SOH方法}
현재 SOH 추정 연구는 다음 세 가지 주요 과제를 안고 있습니다.
- 계산 복잡도 높음: 모델 스택으로 매개변수가 과도하게 증가해 메모리가 작은 BMS 하드웨어에 적합하기 어렵습니다.
- 정확도 불안정: 건강 지표 추출 품질에 제약이 있어, 용량 회복의 급변이나 복잡 운용 조건에서 오차가 커지기 쉽습니다.
- 튜닝 난이도: 모델 성능이 하이퍼파라미터에 민감해 실제 배포 시 강건성이 떨어집니다.

논문은 **옥스퍼드대, NASA, 메릴랜드대**의 첨단 수명주기 공학 센터가 제공하는 세 가지 주요 배터리 데이터셋을 사용했으며, 제안한 SOH 추정 방법은 다음 네 단계로 구성됩니다.

（1）**데이터 수집**：서로 다른 화학계 배터리에 대해 여러 충·방전 프로토콜로 전 수명 열화 시험을 수행하여 제안 모델을 평가합니다.

（2）**특징 공학**：각 사이클의 정전류 충·방전 시간을 건강 지표(*HIs*)로 추출합니다. 선택 구간에서 시작해 창 크기와 보폭을 단계적으로 축소하며 건강 지표를 탐색하고, 창 크기가 0.01V에 도달하거나 더 높은 피어슨 상관계수(*PCC*)를 찾지 못하면 종료합니다. 이후 슬라이딩 윈도우로 건강 지표 시계열을 여러 하위 집합으로 분할하고, 각 윈도우의 다음 시점의 실제 SOH를 라벨로 사용합니다.

（3）**모델 학습**：실험 편의를 위해 Cell1, B0005, CS2-35를 학습 데이터로 선택합니다. 상위 30% 데이터로 384가지 하이퍼파라미터 조합을 학습하고, 나머지 70% 데이터로 검증·비교하여 최적 모델을 선택합니다. 이후 최적 모델을 동일 데이터셋의 다른 배터리 전체 데이터로 테스트해 일반화 성능을 평가하고, BMSFormer를 네 가지 딥러닝 모델과 비교합니다.

（4）**모델 평가**：정확도·효율·안정성의 세 관점에서 평가합니다. 정확도는 네 가지 대표 지표로, 학습 효율은 네 가지 계산 복잡도 지표로 측정하며, 384가지 *R2* 결과로 학습 안정성을 평가합니다.
<img src="/图片1.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">개발된 SOH 추정 방법 흐름도</p>

## BMSFormer 모델{#BMSFormer模型}
1. **전체 프레임워크**

모델의 전체 프레임워크는 그림과 같습니다. 구체적 흐름은 다음과 같습니다. 건강 지표(HIs)를 입력으로 받아 윈도우 분할로 조각화한 뒤 고차원 공간으로 임베딩하여 BMSFormer 블록(LGFA 모듈과 DSConv-L 모듈 포함)에 입력합니다. LGFA의 출력을 전치한 후 DSConv-L에 입력하고 다시 역전치합니다. 마지막으로 모든 BMSFormer 블록의 출력을 다층 퍼셉트론(MLP)으로 입력해 추정 결과를 출력합니다. 학습 과정에서는 각 윈도우 조각의 다음 시점 실제 SOH 값을 라벨로 하여 경사하강을 최적화합니다.
<img src="/图片2.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">BMSFormer 프레임워크</p>

2. **국소-전역 융합 어텐션 메커니즘(LGFA)**

기존 Transformer는 Softmax 어텐션을 사용해 계산 복잡도가 시퀀스 길이의 제곱에 비례합니다.

BMSFormer는 LGFA 모듈을 구성하여 복잡도를 선형 수준으로 낮췄습니다. 장기 열화 추세를 포착하는 동시에 단기 변동에도 민감하며, 모바일 장치에서 빠른 계산에 더 적합합니다.

3. **다중 스케일 깊이 분리 합성곱(DSConv)**

특징 추출을 더욱 풍부하게 하기 위해, BMSFormer는 두 가지 서로 다른 차원의 합성곱 모듈을 삽입합니다.
- DSConv-S: 작은 커널 합성곱으로 세부 특징을 포착합니다.
- DSConv-L: 큰 커널 합성곱으로 장거리 의존성을 추출합니다.

표준 합성곱 대비, 특징 다양성을 유지하면서 매개변수와 계산량을 크게 줄입니다.
<img src="/图片3.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">DSConv 기본 구조</p>

4. **강상관 “단일 건강 지표” 탐색**

저자들은 단계적으로 정밀화하는 탐색 알고리즘을 통해 충전(3.8V-4.2V)과 방전(3.8V-3.4V)의 고주파 SOC 구간에서 건강 지표를 추출했습니다.

실험 결과, 이 방법으로 추출한 지표와 배터리 SOH의 피어슨 상관계수(PCC)가 평균 0.99를 초과함이 확인되었습니다.

## 실험 결과{#实验表现}
**Oxford, NASA, CALCE** 3대 권위 데이터셋을 통해 BMSFormer의 배터리 수명 예측 유효성이 검증되었습니다.

- **추정 정확도 향상**：모든 데이터셋에서 오차 지표(MAE, RMSE)가 최저였습니다. 기존 LSTM 대비 평균 오차를 47%~73% 감소.
 
- **높은 적합도**：R² 점수가 각 시나리오에서 1에 가장 근접(최대 0.9934)하여 예측값이 실제 건강 상태와 가장 잘 일치함을 보여줍니다.
<table style="width:100%; border-collapse: collapse; text-align: center;" border="1">
	<thead>
		<tr style="background-color: #f2f2f2;">
			<th>데이터셋 유형</th>
			<th>평가 지표</th>
			<th><strong>BMSFormer</strong></th>
			<th>CNN-Transformer</th>
			<th>Transformer</th>
			<th>CNN-LSTM</th>
			<th>LSTM</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td rowspan="3"><strong>Oxford</strong><br>(배터리 8개 평균)</td>
			<td>MAE ↓</td>
			<td><strong>0.0023</strong></td>
			<td>0.0027</td>
			<td>0.0043</td>
			<td>0.0057</td>
			<td>0.0087</td>
		</tr>
		<tr>
			<td>RMSE ↓</td>
			<td><strong>0.0031</strong></td>
			<td>0.0037</td>
			<td>0.0056</td>
			<td>0.0082</td>
			<td>0.0116</td>
		</tr>
		<tr>
			<td>R² ↑</td>
			<td><strong>0.9934</strong></td>
			<td>0.9904</td>
			<td>0.9796</td>
			<td>0.9587</td>
			<td>0.9160</td>
		</tr>
		<tr>
			<td rowspan="3"><strong>NASA & CALCE</strong><br>(배터리 8개 평균)</td>
			<td>MAE ↓</td>
			<td><strong>0.0102</strong></td>
			<td>0.0163</td>
			<td>0.0134</td>
			<td>0.0179</td>
			<td>0.0197</td>
		</tr>
		<tr>
			<td>RMSE ↓</td>
			<td><strong>0.0143</strong></td>
			<td>0.0219</td>
			<td>0.0177</td>
			<td>0.0242</td>
			<td>0.0268</td>
		</tr>
		<tr>
			<td>R² ↑</td>
			<td><strong>0.9884</strong></td>
			<td>0.9791</td>
			<td>0.9830</td>
			<td>0.9706</td>
			<td>0.9625</td>
		</tr>
	</tbody>
</table>

## 원문 문헌{#原始文献}
[*Li X, Zhao M, Zhong S, et al. BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator[J]. Energy, 2024, 313(C).*](/BMSFormer.pdf)
