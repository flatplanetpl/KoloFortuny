# Koło Fortuny

Interaktywne koło nagród z 13 równymi polami, realistyczną animacją obrotu i czytelnymi etykietami, które pozostają wyprostowane podczas losowania.

## Funkcje

- 13 równych wizualnie pól i bezpieczne losowanie ważone,
- płynna animacja z synchronizacją wskazówki,
- przycisk „Zatrzymaj” z płynnym hamowaniem bez zmiany wylosowanej nagrody,
- siedem języków, flagi i zapamiętywanie wyboru języka,
- logo Lobstera oraz kod QR i przycisk prowadzące bezpośrednio do formularza opinii Google,
- dźwięki, konfetti i historia wyników,
- obsługa klawiatury, pełnego ekranu i preferencji ograniczonego ruchu,
- responsywny interfejs oraz czytelna lista nagród na telefonach,
- brak zależności i procesu budowania.

## Języki i zatrzymywanie

Menu pokazuje flagę oraz nazwę języka w jego własnym zapisie. Kolejność odpowiada orientacyjnej globalnej popularności: English, 日本語, 한국어, Polski, Українська, Čeština, Беларуская. Polski jest domyślny, a wybrany język zostaje zapamiętany w przeglądarce. Tłumaczenia obejmują koło, listę nagród, komunikaty, historię, ekran wygranej i etykiety dostępności.

Przycisk „Zatrzymaj” skraca obrót do płynnego hamowania, trwającego najwyżej około 1,8 sekundy. Wynik jest losowany przy starcie, więc moment zatrzymania nie zmienia szans 30%/70%. Kolejne kliknięcia nie tworzą dodatkowych wyników. Spacja uruchamia lub zatrzymuje koło, jeśli fokus nie znajduje się na innym elemencie interaktywnym. Przy systemowym ograniczeniu animacji wynik pojawia się od razu.

Sekcja opinii prowadzi do profilu Lobster Brew Pub przy ul. Zwycięskiej 14cc/b. Na komputerze można zeskanować kod QR, a na telefonie otworzyć formularz przyciskiem. Opinia jest dobrowolna i pozostaje niezależna od udziału oraz wyniku losowania.

## Prawdopodobieństwa

Szanse są orientacyjnie dopasowane odwrotnie do wartości nagród. Geometria koła pozostaje symetryczna — mechanizm najpierw losuje nagrodę według wagi, a następnie animuje koło do odpowiadającego jej pola.

| Nagroda | Szansa |
| --- | ---: |
| Nagroda pocieszenia (łącznie 4 pola) | 70% |
| Chipsy | 6% |
| Lemoniada ogórkowa | 4,5% |
| Lemoniada cytrynowa | 4,5% |
| Pils 0,3 | 3% |
| Pszenica 0,3 | 3% |
| Piwo bezalkoholowe | 3% |
| Pils 0,5 | 2% |
| Pszenica 0,5 | 2% |
| Dowolny drink alk/bezalk | 2% |

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
- `motion.js` — ruch koła i płynne zatrzymywanie,
- `i18n.js` — słowniki siedmiu języków,
- `flags/` — lokalne flagi SVG i ich licencja MIT,
- `logo-lobster.jpg` — logo Lobstera używane w interfejsie i jako ikona strony,
- `google-review-qr.svg` — kod QR do formularza opinii Google,
- `tests/core.test.cjs` — testy ruchu, tłumaczeń i zachowania aplikacji,
- `favicon.svg` — ikona strony.

Flagi pochodzą z projektu [flag-icons](https://github.com/lipis/flag-icons). Treść licencji znajduje się w `flags/LICENSE`.

## Sprawdzenie i wdrożenie

Testy nie wymagają instalowania zależności; uruchom je w Node.js 18 lub nowszym:

```bash
node --test tests/core.test.cjs
```

Przy wdrożeniu na własnym hostingu skopiuj razem `index.html`, `styles.css`, `app.js`, `motion.js`, `i18n.js`, `favicon.svg` oraz cały katalog `flags/`. Nowy HTML zawiera oznaczenie wersji zasobów, aby przeglądarki pobrały aktualny kod.

## Wersja online

[lobster-kolo-fortuny.flatplanet.chatgpt.site](https://lobster-kolo-fortuny.flatplanet.chatgpt.site)
