# 組込みシステム向け軽量リチウム電池SOH推定：BMSFormerの設計と応用
## はじめに{#引言}
電気自動車や航空宇宙分野では、**リチウム電池の健康状態（SOH）推定**がシステム安全性を確保する鍵です。しかし、既存のバッテリマネジメントシステムは「両取りが難しい」課題に直面しています。

- 深層学習モデル：高い予測精度を実現できる一方、計算量が大きく、資源制約の厳しい組込み機器での運用が難しい。
- 従来モデル：計算負荷は小さいが、複雑な非線形劣化に対して精度が不十分になりやすい。

《*Energy*》に掲載された論文「***BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator***」では、**BMSFormer**という軽量な深層学習モデルが提案され、計算効率と予測精度の両立によって電池のオンライン監視に新たな解決策を提供しています。

## SOH推定手法{#SOH方法}
現在のSOH推定研究は、主に次の3つの課題に直面しています。
- 計算複雑度が高い：モデルの積み重ねによりパラメータが過剰になり、メモリの小さいBMSハードウェアに適合しにくい。
- 精度が不安定：健康指標の抽出品質に制約があり、容量回復の突発や複雑な運用条件で誤差が増えやすい。
- 調整が難しい：ハイパーパラメータに性能が大きく依存し、実装時のロバスト性が低い。

本論文は**オックスフォード大学、米国NASA、メリーランド大学**の先進ライフサイクル工学センターが提供する3つの主要電池データセットを使用し、以下の4ステップで課題を解決しています。

（1）**データ取得**：異なる化学系電池に対して複数の充放電プロトコルで全寿命の劣化試験を実施し、提案モデルを評価。

（2）**特徴量エンジニアリング**：各サイクルの定電流充放電時間を健康指標（*HIs*）として抽出。選定区間から開始し、窓幅とステップを段階的に縮小して指標探索を行い、窓幅が0.01Vに達するか、より高いピアソン相関係数（*PCC*）が得られない場合に停止。続いてスライディングウィンドウで時系列の健康指標を複数サブセットに分割し、各ウィンドウの次タイムステップの真のSOHをラベルとする。

（3）**モデル学習**：実験の便宜上、Cell1、B0005、CS2-35を学習用に選定。先頭30%のデータで384通りのハイパーパラメータ組合せを学習し、残り70%で検証・比較して最良モデルを選択。次に最良モデルを同一データセット内の他電池の全量データで評価し、汎化性能を確認。さらにBMSFormerを4種の深層学習モデルと比較。

（4）**モデル評価**：精度・効率・安定性の3視点で評価。精度は4種の代表指標、学習効率は4種の計算複雑度指標で測定。さらに384通りの*R2*結果で学習安定性を評価。
<img src="/en图片1.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">開発したSOH推定手法のフロー図</p>

## BMSFormerモデル{#BMSFormer模型}
1. **全体フレームワーク**

モデル全体のフレームワークは図の通りです。具体的な流れは以下の通りです。健康指標（HIs）を入力とし、ウィンドウ分割で断片化した後に高次元へ埋め込み、BMSFormerブロック（LGFAモジュールとDSConv-Lモジュールを含む）に入力します。LGFAの出力を転置してDSConv-Lへ入力し、さらに逆転置を行います。最後に全BMSFormerブロックの出力を多層パーセプトロン（MLP）へ入力し、推定結果を出力します。学習時は各ウィンドウ断片の次タイムステップの真のSOH値をラベルとして勾配降下を最適化します。
<img src="/en图片2.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">BMSFormerフレームワーク図</p>

2. **局所・大域融合注意機構（LGFA）**

従来のTransformerはSoftmax注意機構を用い、計算複雑度が系列長の二乗に比例します。

BMSFormerはLGFAモジュールを構築し、複雑度を線形に低減。長期的な劣化トレンドを捉えるだけでなく、短期的な揺らぎにも高い感度を持ち、モバイル端末での高速計算に適しています。

3. **マルチスケール深度分離畳み込み（DSConv）**

特徴抽出をさらに豊かにするため、BMSFormerは2種類の畳み込みモジュールを組み込みます。
- DSConv-S：小カーネル畳み込み。細部特徴を捉える。
- DSConv-L：大カーネル畳み込み。長距離依存を抽出。

標準畳み込みに比べ、特徴の多様性を保ちながらパラメータ数と計算量を大幅に削減します。
<img src="/en图片3.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">DSConvの基本構造図</p>

4. **強相関「単一健康指標」探索**

著者は段階的に精密化する探索アルゴリズムにより、充電（3.8V-4.2V）および放電（3.8V-3.4V）の高周波SOC断片から健康指標を抽出しました。

実験では、この方法で得られた指標と電池SOHのピアソン相関係数（PCC）が平均0.99を超えることが示されています。

## 実験結果{#实验表现}
**Oxford、NASA、CALCE**の3大データセットにより、BMSFormerの電池寿命推定の有効性が検証されました。

- **推定精度の向上**：全データセットで誤差指標（MAEとRMSE）が最小。従来LSTM比で平均誤差を47%〜73%低減。
 
- **高い適合度**：R²スコアは各シナリオで1に最も近く（最大0.9934）、予測値が実測SOHと最も整合。
<table style="width:100%; border-collapse: collapse; text-align: center;" border="1">
	<thead>
		<tr style="background-color: #f2f2f2;">
			<th>データセット種別</th>
			<th>評価指標</th>
			<th><strong>BMSFormer</strong></th>
			<th>CNN-Transformer</th>
			<th>Transformer</th>
			<th>CNN-LSTM</th>
			<th>LSTM</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td rowspan="3"><strong>Oxford</strong><br>(8電池平均)</td>
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
			<td rowspan="3"><strong>NASA & CALCE</strong><br>(8電池平均)</td>
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

## 原著論文{#原始文献}
[*Li X, Zhao M, Zhong S, et al. BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator[J]. Energy, 2024, 313(C).*](/BMSFormer.pdf)
