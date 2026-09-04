# Koło Fortuny

Interaktywne koło nagród z 13 równymi polami, realistyczną animacją obrotu i czytelnymi etykietami, które pozostają wyprostowane podczas losowania.

## Funkcje

- 13 równych wizualnie pól i bezpieczne losowanie ważone,
- płynna animacja z synchronizacją wskazówki,
- dźwięki, konfetti i historia wyników,
- obsługa klawiatury, pełnego ekranu i preferencji ograniczonego ruchu,
- responsywny interfejs oraz czytelna lista nagród na telefonach,
- brak zależności i procesu budowania.

## Prawdopodobieństwa

Szanse są orientacyjnie dopasowane odwrotnie do wartości nagród. Geometria koła pozostaje symetryczna — mechanizm najpierw losuje nagrodę według wagi, a następnie animuje koło do odpowiadającego jej pola.

| Nagroda | Szansa |
| --- | ---: |
| Nagroda pocieszenia (łącznie 4 pola) | 35% |
| Chipsy | 13% |
| Lemoniada ogórkowa | 10% |
| Lemoniada cytrynowa | 10% |
| Pils 0,3 | 7% |
| Pszenica 0,3 | 6% |
| Piwo bezalkoholowe | 6% |
| Pils 0,5 | 5% |
| Pszenica 0,5 | 4% |
| Dowolny drink alk/bezalk | 4% |

## Uruchomienie

Możesz otworzyć `index.html` bezpośrednio albo uruchomić prosty serwer lokalny:

```bash
python -m http.server 8080
```

Następnie otwórz `http://localhost:8080`.

## Struktura

- `index.html` — struktura aplikacji,
- `styles.css` — wygląd i układ responsywny,
- `app.js` — geometria koła, animacja i logika losowania,
- `favicon.svg` — ikona strony.

## Wersja online

[lobster-kolo-fortuny.flatplanet.chatgpt.site](https://lobster-kolo-fortuny.flatplanet.chatgpt.site)
