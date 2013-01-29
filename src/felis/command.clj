(ns felis.command
  (:require [clojure.string :as string]))

(def commands {})

(defn run [editor]
  (let [[command & args] (-> editor :minibuffer :commnad (string/split #" "))]
    (if-let [f (commands commnad)]
      (apply f editor args)
      editor)))
