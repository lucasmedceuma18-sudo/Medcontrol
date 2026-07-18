# Rentabilização por internamento (SUS/SIH) — notas de referência

> Síntese de 3 fontes oficiais, para consulta rápida. Não substitui a legislação vigente nem assessoria de faturamento profissional — os valores mudam mensalmente (competência SIGTAP) e algumas regras deste manual são de 2004/2010, podendo ter sido atualizadas por portarias posteriores.

**Fontes:**
- Tabela Unificada SIGTAP, competência 2026-07 (espelho do FTP DATASUS via github.com/RenatoKR/SIGTAP)
- Portaria SAS/MS nº 436, de 10/09/2010 (atributos gerais e complementares da tabela SIGTAP)
- Manual do Sistema de Informações Hospitalares do SUS (SIH/SUS), Ministério da Saúde, dez/2004

## Estrutura de valor de um procedimento

Cada procedimento da tabela tem até 3 componentes de valor, somados para formar o valor total da AIH:

| Componente | O que cobre |
|---|---|
| **SH** (Serviços Hospitalares) | Diárias, taxa de sala, materiais, medicamentos, SADT comum |
| **SP** (Serviços Profissionais) | Honorários médicos/cirurgião-dentista, rateados por pontos |
| **SA** (Serviço Ambulatorial) | Equivalente ao SH, mas para atendimento ambulatorial (não internação) |

## Mecânicas que aumentam (ou reduzem) o valor da AIH

- **Cirurgia múltipla** (mesma equipe/ato anestésico, patologias distintas): até 5 procedimentos por AIH, componente SH pago em percentual decrescente — 1º=100%, 2º=75%, 3º=75%, 4º=60%, 5º=50%. SP e SADT sempre a 100%.
- **Politraumatizado** (código 39.000.00.1): até 5 procedimentos lançados em ordem decrescente de complexidade/valor, sem a degressão da cirurgia múltipla.
- **Diárias e componentes especiais** (Campo Procedimentos Especiais): cada um soma à conta, com limite próprio —
  - UTI/Cuidados Intermediários Neonatal: 2 valores (3 primeiros dias vs. subsequentes), máx. 59 diárias/AIH
  - Diária de acompanhante, diálise/hemodiálise, quimio/radioterapia, nutrição parenteral, tomografia/ressonância, ciclosporina, fatores de coagulação, entre outros
- **OPM** (órteses, próteses, materiais especiais): reembolsado à parte, por nota fiscal.
- **Rateio do SP entre profissionais**: valor do ponto = (Σ valores SP da AIH) ÷ (Σ pontos de todos os atos); cada profissional recebe (seus pontos × valor do ponto). **Anestesista foge da regra**: recebe 30% fixo do SP do procedimento cirúrgico (não entra no rateio geral).

## Onde a receita se perde

O manual SIH/SUS cataloga ~144 motivos de rejeição/glosa de AIH (seção 10). Os mais recorrentes na prática:
- CPF/CNPJ de profissional errado ou não cadastrado
- Procedimento incompatível com CID, idade, sexo ou especialidade
- Diária de UTI/acompanhante além do limite ou sem habilitação
- Mudança de procedimento não autorizada/não comunicada
- Cirurgia múltipla cobrada fora da ordem/regra de percentual
- Datas de internação/saída inconsistentes

## Estimativa de valor por diagnóstico (implementada no MedControl)

O app usa uma tabela curada (não exaustiva) de correspondência diagnóstico → procedimento SIGTAP → valor, para os diagnósticos mais comuns observados na rotina do hospital. Ver `AIH_ESTIMATIVAS` em `index.html`. Cobre ~13 categorias (fraturas comuns, apendicite, hérnias, colecistite, pneumonia, diabetes, AVC, IAM, ITU/pielonefrite, cesariana, hiperplasia prostática) — diagnósticos fora dessa lista aparecem como "sem estimativa cadastrada". Para expandir, repita o processo: localizar o procedimento correspondente em `tb_procedimento.txt` (baixado do SIGTAP) e adicionar a entrada.
