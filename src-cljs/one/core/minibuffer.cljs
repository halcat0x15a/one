(ns one.core.minibuffer
  (:require [one.core :as core]))

(defrecord History [current commands cursor])

(def default-history (History. "" (list) 0))

(defn update-history [editor f]
  (assoc editor
    :history (f (:history editor))))

(defn add-history [editor command]
  (update-history editor #(assoc %
                            :commands (cons command (:commands %)))))

(defn set-current-command [editor command]
  (update-history editor #(assoc % :current command)))

(def get-history-cursor (comp :cursor :history))

(defn set-history-cursor [editor cursor]
  (assoc editor
    :history (assoc (:history editor)
               :cursor cursor)))

(defn prepare-history [editor]
  (-> editor
      (core/set-text [""])
      (set-current-command "")
      (set-history-cursor 0)))

(defn get-command [editor]
  (let [history (:history editor)]
    (nth (:commands history) (:cursor history))))

(defn prev-command [editor]
  (let [{:keys [commands cursor]} (:history editor)
        cursor' (inc cursor)]
    (when (< cursor' (count commands))
      (set-history-cursor editor cursor'))))

(defn next-command [editor]
  (let [cursor (:cursor (:history editor))
        cursor' (dec cursor)]
    (when (> cursor 0)
      (set-history-cursor editor cursor'))))

(defn set-prev-command [editor]
  (if-let [editor' (prev-command editor)]
    (set-current-command editor' (get-command editor'))
    editor))

(defn set-next-command [editor]
  (if-let [editor' (next-command editor)]
    (set-current-command editor' (get-command editor'))
    editor))

(defn eval-command [editor]
  (let [command (core/get-command editor)]
    (if-let [f (core/parse-command editor command)]
      (-> (apply (first f) (prepare-history editor) (rest f))
          (add-history command))
      editor)))