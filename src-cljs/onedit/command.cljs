(ns onedit.command)

(defn update-history [editor f]
  (let [history (:history editor)]
    (assoc editor
      :history (assoc history
                 :commands (f (:commands history))))))

(defn add-history [editor command]
  (update-history editor (partial cons command)))

(defn set-current-command [editor command]
  (update-history editor (comp (partial cons command) rest)))

(def get-history-cursor (comp :cursor :history))

(defn set-history-cursor [editor cursor]
  (assoc editor
    :history (assoc (:history editor)
               :cursor cursor)))

(defn reset-history [editor]
  (-> editor
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
    (if (zero? (get-history-cursor editor'))
      (set-current-command editor' "")
      (set-current-command editor' (get-command editor')))
    editor))
