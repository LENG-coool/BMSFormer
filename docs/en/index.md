# Lightweight Lithium Battery SOH Estimation for Embedded Systems: Design and Application of BMSFormer
## Introduction{#introduction}
In fields such as electric vehicles and aerospace, **lithium battery state-of-health estimation** is crucial for ensuring system safety. However, existing battery management systems face a dilemma:

- Deep learning models: Although capable of providing accurate predictions, their computational complexity is too high, making them difficult to run on resource-constrained embedded devices;
- Traditional models: Although computationally lightweight, their accuracy is often unsatisfactory when dealing with complex battery nonlinear degradation.

A recent paper published in *Energy*, titled ***BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator***, proposes a lightweight deep learning model called **BMSFormer** that provides a new solution for battery online monitoring by balancing computational efficiency and prediction accuracy.

## SOH Estimation Method{#soh-method}
Current SOH estimation research faces three major challenges:
- High computational complexity: Model stacking leads to excessive parameters, making it difficult to adapt to BMS hardware with minimal memory.
- Unstable accuracy: Limited by the quality of health indicator extraction, large errors occur when facing sudden capacity recovery or complex operating conditions.
- Difficult hyperparameter tuning: Model performance is highly sensitive to hyperparameters, resulting in poor robustness in actual deployment.

The paper employs three mainstream battery datasets from **the University of Oxford, NASA, and the Center for Advanced Life Cycle Engineering at the University of Maryland** to address these issues with the proposed SOH estimation method, which includes the following four steps:

(1) **Data Collection**: Full life cycle aging experiments are conducted on batteries with three different chemical systems under various charge-discharge protocols to evaluate the proposed model.

(2) **Feature Engineering**: Constant current charge-discharge time from each cycle is extracted as health indicators (*HIs*). Starting from a selected interval, health indicator search is performed by gradually reducing window size and step size until the window size reaches 0.01V or no higher Pearson correlation coefficient (*PCC*) is found. Subsequently, sliding windows are used to divide the health indicator time series data into multiple subsets, with the true SOH of the next time step under each window serving as the label for the corresponding subset.

(3) **Model Training**: For experimental convenience, Cell1, B0005, and CS2-35 are selected as training sets, using the first 30% of data for training under 384 hyperparameter combinations, and the remaining 70% for validation and comparison to select the best-performing model. Subsequently, the optimal model is directly tested on the full data of other batteries in the corresponding dataset to evaluate the model's generalization ability, and BMSFormer is compared with four different deep learning models.

(4) **Model Evaluation**: Different models are evaluated from three dimensions: accuracy, efficiency, and stability. Four typical evaluation metrics are used to measure accuracy, four commonly used computational complexity metrics to assess training efficiency, and the *R²* results from 384 hyperparameter combinations to evaluate the stability of training results.
<img src="/en图片1.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">Flowchart of the developed SOH estimation method</p>

## BMSFormer Model{#bmsformer-model}
1. **Overall Framework**

The overall framework of the model is shown in the figure. The specific process is as follows: using health indicators (HIs) as input, they are divided into segments through window segmentation, embedded into high-dimensional space, and then input into BMSFormer blocks (containing LGFA module and DSConv-L module); the output of the LGFA module is transposed and then input into the DSConv-L module, followed by inverse transpose operation; finally, the outputs of all BMSFormer blocks are fed into a multilayer perceptron (MLP) layer to produce the final estimation result. During training, the true SOH value of the next time step for each window segment serves as the label to guide the model for gradient descent optimization.
<img src="/en图片2.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">BMSFormer framework diagram</p>

2. **Local-Global Fusion Attention** (LGFA)

Traditional Transformers use Softmax attention, with computational complexity growing quadratically with sequence length.

BMSFormer constructs an LGFA module that reduces complexity to linear level. It can not only capture long-term degradation trends like traditional models but also maintain high sensitivity to short-term fluctuations and is more suitable for fast computation on mobile devices.

3. **Multi-scale Depthwise Separable Convolution** (DSConv)

To further enrich feature extraction, BMSFormer embeds two convolutional modules of different dimensions:
- DSConv-S: Small kernel convolution, responsible for capturing detailed features.
- DSConv-L: Large kernel convolution, responsible for extracting long-range dependencies.

Compared to standard convolution, this design significantly reduces the number of parameters and computational cost while maintaining feature diversity.
<img src="/en图片3.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">DSConv basic structure diagram</p>

4. **Strongly Correlated "Single Health Indicator" Search**

The authors extract health indicators from high-frequency SOC segments during charging (3.8V-4.2V) and discharging (3.8V-3.4V) through a progressively refined search algorithm.

Experiments demonstrate that the Pearson correlation coefficient (PCC) between the indicators extracted by this method and battery SOH averages over 0.99.

## Experimental Performance{#experimental-performance}
Through validation on the three authoritative datasets **Oxford, NASA, and CALCE**, BMSFormer verifies its effectiveness in battery life prediction:

- **Improved estimation accuracy**: On all datasets, its error metrics (*MAE* and *RMSE*) are the lowest. Compared with traditional LSTM models, the average error is reduced by 47% to 73%.

- **High goodness of fit**: Its *R²* scores are closest to 1 across all scenarios (up to 0.9934), proving that its predictions are most closely aligned with true health status.

## Original Reference{#original-reference}
[*Li X, Zhao M, Zhong S, et al. BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator[J]. Energy, 2024, 313(C).*](/BMSFormer.pdf)
