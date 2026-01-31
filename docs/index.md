# 面向嵌入式系统的轻量化锂电池 SOH 估计：BMSFormer 的设计与应用
## 引言{#引言}
在电动汽车、航空航天等领域，**锂电池的健康状态估计**是确保系统安全的关键。然而，现有的电池管理系统面临着一个“鱼与熊掌”的困境：

- 深度学习模型：虽然能够提供准确的预测，但其计算复杂度过高，难以在资源受限的嵌入式设备上运行；
- 传统模型:虽然计算开销小，但在面对复杂的电池非线性退化时，精度往往难以令人满意。

近期发表在《*Energy*》上的论文《***BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator***》提出了一种名为 **BMSFormer**的轻量化深度学习模型，通过平衡计算效率与预测精度，为电池在线监测提供了新的解决方案。

## SOH估计方法{#SOH方法}
目前的 SOH 估计研究主要面临三大痛点：
- 计算复杂度高：模型堆叠导致参数过多，难以适配内存极小的 BMS 硬件。
- 精度不稳定：受限于健康指标的提取质量，面对突发的容量回升或复杂工况时误差较大。
- 调参困难：模型性能对超参数高度敏感，实际部署时的鲁棒性较差。

论文采用了**牛津大学、美国国家航空航天局和马里兰大学**先进生命周期工程中心的三种主流电池数据集，所提出的 SOH 估计方法来解决以上问题，包括以下四个步骤：

（1）**数据采集**：对三种不同化学体系的电池在多种充放电协议下进行全生命周期老化试验，以评估所提模型。

（2）**特征工程**：提取每个循环的恒流充放电时间作为健康指标（*HIs*）。从选定区间开始，通过逐步缩小窗口大小和步长进行健康指标搜索，直至窗口大小达到 0.01V 或未找到更高的皮尔逊相关系数（*PCC*）值。随后采用滑动窗口将健康指标时序数据划分为多个子集，每个窗口下一个时间步的真实 SOH 作为对应子集的标签。

（3）**模型训练**：为方便实验，选取 Cell1、B0005 和 CS2-35 作为训练集，使用前 30% 的数据在 384 种超参数组合下进行训练，剩余 70% 的数据用于验证和对比，以筛选出性能最优的模型。随后，将最优模型直接在对应数据集的其他电池全量数据上进行测试，评估模型的泛化能力，并将 BMSFormer 与四种不同的深度学习模型进行性能对比。

（4）**模型评估**：从精度、效率和稳定性三个维度对不同模型进行评估。采用四种典型评估指标衡量精度，四种常用计算复杂度指标评估训练效率，通过 384 种超参数组合的*R2*结果评估训练结果的稳定性。
<img src="/图片1.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">开发的SOH估计方法流程图</p>

## BMSFormer模型{#BMSFormer模型}
1. **整体框架**

模型整体框架如图所示，具体流程如下：以健康指标（HIs）为输入，通过窗口分割将其划分为片段，嵌入至高维空间后输入 BMSFormer 块（包含 LGFA 模块和 DSConv-L 模块）；LGFA 模块的输出经过转置操作后，输入 DSConv-L 模块，再进行逆转置操作；最后，所有 BMSFormer 块的输出输入多层感知机（MLP）层，最终输出估计结果。训练过程中，以每个窗口片段的下一个时间步的真实 SOH 值作为标签，指导模型进行梯度下降优化。
<img src="/图片2.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">BMSFormer框架图</p>

2. **局部-全局融合注意力机制**(LGFA)

传统的Transformer使用Softmax注意力，计算复杂度随序列长度呈平方级增长。

而BMSFormer构建了LGFA模块，将复杂度降至线性级。它不仅能像传统模型那样捕捉长期退化趋势，还能对短期波动保持高度敏感，且更适合在移动设备上快速计算 。

3. **多尺度深度可分离卷积**(DSConv)

为了进一步丰富特征提取，BMSFormer 嵌入了两种不同维度的卷积模块 ：
- DSConv-S：小核卷积，负责捕捉细节特征 。
- DSConv-L：大核卷积，负责提取长程依赖 。

相比标准卷积，这种设计在保持特征多样性的同时，大幅减少了参数量和计算量 。
<img src="/图片3.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">DSConv基本结构图</p>

4. **强相关“单健康指标”搜索**

文章作者通过逐步精细化的搜索算法，在充电（3.8V-4.2V）和放电（3.8V-3.4V）的高频 SOC 片段中提取健康指标。

实验证明，这种方法提取的指标与电池 SOH 的皮尔逊相关系数（PCC）平均超过 0.99 。

## 实验表现{#实验表现}
通过在**Oxford、NASA 和 CALCE**三大权威数据集上的验证，BMSFormer展现了压倒性的优势：

- **精度断层领先**：在所有数据集上，其误差指标（MAE和RMSE）均为最低。相比传统LSTM模型，平均误差降低了 47% 至 73% 。
 
- **拟合近乎完美**：其R²评分在各场景下均最接近 1（最高达 0.9934），证明其预测值与真实健康状态最为贴合。
<table style="width:100%; border-collapse: collapse; text-align: center;" border="1">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th>数据集类型</th>
      <th>评估指标</th>
      <th><strong>BMSFormer</strong></th>
      <th>CNN-Transformer</th>
      <th>Transformer</th>
      <th>CNN-LSTM</th>
      <th>LSTM</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3"><strong>Oxford</strong><br>(8个电池平均)</td>
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
      <td rowspan="3"><strong>NASA & CALCE</strong><br>(8个电池平均)</td>
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

## 原始文献{#原始文献}
[*Li X, Zhao M, Zhong S, et al. BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator[J]. Energy, 2024, 313(C).*](/BMSFormer.pdf)
