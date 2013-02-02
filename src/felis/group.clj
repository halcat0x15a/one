(ns felis.group
  (:require [clojure.string :as string]
            [felis.style :as style]
            [felis.node :as node]
            [felis.empty :as empty]))

(defrecord Group [buffer minibuffer]
  node/Node
  (render [group]
    #tag[:html {}
         #tag[:head {}
              #tag[:style {:type "text/css"}
                   "<!-- "
                   (->> style/all (interpose \space) string/join)
                   " -->"]]
         #tag[:body {}
              #tag[:div {:class "editor"}
                   (node/render buffer)
                   (node/render minibuffer)]]]))

(defmethod node/path Group [_] [:root])

(defmethod empty/empty Group [_]
  (Group. (empty/empty felis.buffer.Buffer) (empty/empty felis.text.Minibuffer)))
