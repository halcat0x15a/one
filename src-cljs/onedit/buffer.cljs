(ns onedit.buffer
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [onedit.core :as core])
  (:use-macros [clojure.core.match.js :only [match]]))

(defn value []
  (string/split (gdom/getRawTextContent (dom/ensure-element :buffer)) #"\n"))

(defn update [buffer]
  (dom/set-text :buffer (string/join (interpose \newline buffer))))

(defn new-line [editor]
  (let [[_ y] (:cursor editor)]
    (assoc editor
      :buffer (conj (:buffer editor) "")
      :cursor [0 (inc y)])))

(defn insert [editor & strings]
  (match [(vec strings)]
    [[]] editor
    [[string]] (let [[x y] (:cursor editor)
                     buffer (:buffer editor)
                     line (get buffer y)
                     line' (str (subs line 0 x) string (subs line x (count line)))]
                 (dom/log buffer)
                 (assoc editor
                   :buffer (assoc buffer y line')
                   :cursor [(+ x (count string)) y]))
    [[head & tail]] (apply insert (new-line (insert editor head)) tail)))

(core/register :i insert)
(core/register :o new-line)
