# Stima Leggera dello SOH delle Batterie al Litio per Sistemi Embedded: Progettazione e Applicazione di BMSFormer
## Introduzione{#introduzione}
In settori come i veicoli elettrici e l'aerospaziale, **la stima dello stato di salute delle batterie al litio** è cruciale per garantire la sicurezza del sistema. Tuttavia, i sistemi di gestione delle batterie esistenti affrontano un dilemma:

- Modelli di deep learning: sebbene capaci di fornire previsioni accurate, la loro complessità computazionale è troppo elevata, rendendoli difficili da eseguire su dispositivi embedded con risorse limitate;
- Modelli tradizionali: sebbene computazionalmente leggeri, la loro accuratezza è spesso insoddisfacente quando si tratta di gestire la degradazione non lineare complessa delle batterie.

Un recente articolo pubblicato su *Energy*, intitolato ***BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator***, propone un modello di deep learning leggero chiamato **BMSFormer** che fornisce una nuova soluzione per il monitoraggio online delle batterie bilanciando efficienza computazionale e accuratezza predittiva.

## Metodo di Stima dello SOH{#metodo-soh}
L'attuale ricerca sulla stima dello SOH affronta tre sfide principali:
- Alta complessità computazionale: l'impilamento di modelli porta a parametri eccessivi, rendendo difficile l'adattamento all'hardware BMS con memoria minima.
- Accuratezza instabile: limitata dalla qualità dell'estrazione degli indicatori di salute, si verificano grandi errori quando si affrontano recuperi improvvisi di capacità o condizioni operative complesse.
- Difficile ottimizzazione degli iperparametri: le prestazioni del modello sono altamente sensibili agli iperparametri, con conseguente scarsa robustezza nell'implementazione reale.

L'articolo utilizza tre dataset di batterie mainstream provenienti **dall'Università di Oxford, dalla NASA e dal Center for Advanced Life Cycle Engineering dell'Università del Maryland** per affrontare questi problemi con il metodo di stima dello SOH proposto, che comprende i seguenti quattro passaggi:

(1) **Raccolta dati**: vengono condotti esperimenti di invecchiamento dell'intero ciclo di vita su batterie con tre diversi sistemi chimici sotto vari protocolli di carica-scarica per valutare il modello proposto.

(2) **Feature Engineering**: il tempo di carica-scarica a corrente costante di ogni ciclo viene estratto come indicatori di salute (*HIs*). A partire da un intervallo selezionato, la ricerca degli indicatori di salute viene eseguita riducendo gradualmente la dimensione della finestra e il passo fino a quando la dimensione della finestra raggiunge 0,01V o non viene trovato un coefficiente di correlazione di Pearson (*PCC*) più alto. Successivamente, vengono utilizzate finestre scorrevoli per dividere i dati delle serie temporali degli indicatori di salute in più sottoinsiemi, con il vero valore SOH del passo temporale successivo sotto ogni finestra che funge da etichetta per il sottoinsieme corrispondente.

(3) **Addestramento del modello**: per comodità sperimentale, Cell1, B0005 e CS2-35 vengono selezionati come set di addestramento, utilizzando il primo 30% dei dati per l'addestramento con 384 combinazioni di iperparametri e il restante 70% per la validazione e il confronto per selezionare il modello con le migliori prestazioni. Successivamente, il modello ottimale viene testato direttamente sui dati completi di altre batterie nel dataset corrispondente per valutare la capacità di generalizzazione del modello, e BMSFormer viene confrontato con quattro diversi modelli di deep learning.

(4) **Valutazione del modello**: diversi modelli vengono valutati da tre dimensioni: accuratezza, efficienza e stabilità. Vengono utilizzate quattro metriche di valutazione tipiche per misurare l'accuratezza, quattro metriche di complessità computazionale comunemente utilizzate per valutare l'efficienza di addestramento e i risultati *R²* da 384 combinazioni di iperparametri per valutare la stabilità dei risultati di addestramento.
<img src="/en图片1.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">Diagramma di flusso del metodo di stima dello SOH sviluppato</p>

## Modello BMSFormer{#modello-bmsformer}
1. **Framework Generale**

Il framework generale del modello è mostrato nella figura. Il processo specifico è il seguente: utilizzando gli indicatori di salute (HIs) come input, vengono divisi in segmenti attraverso la segmentazione della finestra, incorporati nello spazio ad alta dimensione e quindi immessi nei blocchi BMSFormer (contenenti il modulo LGFA e il modulo DSConv-L); l'output del modulo LGFA viene trasposto e quindi immesso nel modulo DSConv-L, seguito dall'operazione di trasposizione inversa; infine, gli output di tutti i blocchi BMSFormer vengono alimentati in un layer perceptron multistrato (MLP) per produrre il risultato finale della stima. Durante l'addestramento, il vero valore SOH del passo temporale successivo per ogni segmento di finestra funge da etichetta per guidare il modello per l'ottimizzazione della discesa del gradiente.
<img src="/en图片2.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">Diagramma del framework BMSFormer</p>

2. **Attenzione a Fusione Locale-Globale** (LGFA)

I Transformer tradizionali utilizzano l'attenzione Softmax, con una complessità computazionale che cresce quadraticamente con la lunghezza della sequenza.

BMSFormer costruisce un modulo LGFA che riduce la complessità a livello lineare. Può non solo catturare tendenze di degrado a lungo termine come i modelli tradizionali, ma anche mantenere un'elevata sensibilità alle fluttuazioni a breve termine ed è più adatto per il calcolo rapido su dispositivi mobili.

3. **Convoluzione Separabile in Profondità Multi-scala** (DSConv)

Per arricchire ulteriormente l'estrazione delle caratteristiche, BMSFormer incorpora due moduli convolutivi di diverse dimensioni:
- DSConv-S: convoluzione a kernel piccolo, responsabile della cattura di caratteristiche dettagliate.
- DSConv-L: convoluzione a kernel grande, responsabile dell'estrazione di dipendenze a lungo raggio.

Rispetto alla convoluzione standard, questo design riduce significativamente il numero di parametri e il costo computazionale mantenendo la diversità delle caratteristiche.
<img src="/en图片3.png" style="width: 100%; margin: 0 auto; display: block;" />
<p align="center" style="color: grey">Diagramma della struttura di base DSConv</p>

4. **Ricerca di "Indicatore Singolo di Salute" Fortemente Correlato**

Gli autori estraggono indicatori di salute da segmenti SOC ad alta frequenza durante la carica (3,8V-4,2V) e la scarica (3,8V-3,4V) attraverso un algoritmo di ricerca progressivamente raffinato.

Gli esperimenti dimostrano che il coefficiente di correlazione di Pearson (PCC) tra gli indicatori estratti con questo metodo e lo SOH della batteria è in media superiore a 0,99.

## Prestazioni Sperimentali{#prestazioni-sperimentali}
Attraverso la validazione sui tre dataset autorevoli **Oxford, NASA e CALCE**, BMSFormer verifica la sua efficacia nella previsione della vita della batteria:

- **Miglioramento dell'accuratezza di stima**: su tutti i dataset, le sue metriche di errore (*MAE* e *RMSE*) sono le più basse. Rispetto ai modelli LSTM tradizionali, l'errore medio è ridotto dal 47% al 73%.

- **Elevata bontà di adattamento**: i suoi punteggi *R²* sono i più vicini a 1 in tutti gli scenari (fino a 0,9934), dimostrando che le sue previsioni sono più strettamente allineate con lo stato di salute reale.
<table style="width:100%; border-collapse: collapse; text-align: center;" border="1">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th>Tipo di Dataset</th>
      <th>Metrica di Valutazione</th>
      <th><strong>BMSFormer</strong></th>
      <th>CNN-Transformer</th>
      <th>Transformer</th>
      <th>CNN-LSTM</th>
      <th>LSTM</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3"><strong>Oxford</strong><br>(Media di 8 celle)</td>
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
      <td rowspan="3"><strong>NASA & CALCE</strong><br>(Media di 8 celle)</td>
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

## Riferimento Originale{#riferimento-originale}
[*Li X, Zhao M, Zhong S, et al. BMSFormer: An efficient deep learning model for online state-of-health estimation of lithium-ion batteries under high-frequency early SOC data with strong correlated single health indicator[J]. Energy, 2024, 313(C).*](/BMSFormer.pdf)
