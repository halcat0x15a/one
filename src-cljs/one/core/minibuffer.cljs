(ns one.core.minibuffer
  (:require [one.core.lens :as lens]
            [one.core.parser :as parser]))

(defrecord Minibuffer [command cursor])

(defrecord History [current commands cursor])

(def default-history (History. "" (list) 0))

(defn add-history [editor command]
  (lens/modify lens/commands #(cons command %) editor))

(defn prepare-history [editor]
  (->> editor
       (lens/lens-set lens/text [""])
       (lens/lens-set lens/current-command "")
       (lens/lens-set lens/history-cursor 0)))

(defn get-command [editor]
  (let [history (:history editor)]
    (nth (:commands history) (:cursor history))))

(defn prev-command [editor]
  (let [{:keys [commands cursor]} (:history editor)
        cursor' (inc cursor)]
    (when (< cursor' (count commands))
      (lens/lens-set lens/history-cursor cursor' editor))))

(defn next-command [editor]
  (let [cursor (:cursor (:history editor))
        cursor' (dec cursor)]
    (when (> cursor 0)
      (lens/lens-set lens/history-cursor cursor' editor))))

(defn set-prev-command [editor]
  (if-let [editor' (prev-command editor)]
    (lens/lens-set lens/current-command (get-command editor') editor')
    editor))

(defn set-next-command [editor]
  (if-let [editor' (next-command editor)]
    (lens/lens-set lens/current-command (get-command editor') editor')
    editor))

(defn eval-command [editor]
  (let [command (first (lens/lens-get lens/minibuffer-text editor))]
    (if-let [f (parser/parse-command command editor)]
      (-> (apply (first f) (prepare-history editor) (rest f))
          (add-history command))
      editor)))
