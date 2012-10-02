(ns one.test
  (:require [one.core :as core]
            [one.core.text :as text]
            [one.core.cursor :as cursor]
            [one.core.buffer :as buffer]
            [one.core.view :as view]
            [one.core.editor :as editor]
            [one.core.minibuffer :as minibuffer]
            [one.core.mode :as mode]
            [one.core.parser :as parser]
            [one.core.syntax :as syntax])
  (:use clojure.test))

(deftest core
  (testing "get line"
    (is (= (core/get-line (core/set-text (editor/editor) ["hello" "world"]) 0)
           "hello"))
    (testing "with index out of bounds"
      (is (nil? (core/get-line (core/set-text (editor/editor) ["hello" "world"]) 2)))))
  (testing "set line"
    (is (= (core/set-line (core/set-text (editor/editor) ["hello" "world"]) 1 "miku")
           (core/set-text (editor/editor) ["hello" "miku"]))))
  (testing "count line"
    (is (= (core/count-line (core/set-text (editor/editor) ["hello" "world"]) 0)
           5))
    (testing "with index out of bounds"
      (is (nil? (core/count-line (core/set-text (editor/editor) ["hello" "world"]) 2)))))
  (testing "calculate cursor position"
    (are [x y] (= x y)
         (core/cursor-position (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 3 0)})))
         3
         (core/cursor-position (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 3 1)})))
         9))
  (testing "parse command"
    (is (= (core/parse-command (assoc (editor/editor) :functions {:f :function}) "f a")
           (list :function "a")))))

(deftest text
  (testing "prepend newline"
    (is (= (text/prepend-newline (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "" "world"] :cursor (cursor/saved-cursor 0 1)})))))
  (testing "append newline"
    (is (= (text/append-newline (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world" ""] :cursor (cursor/->Cursor 0 2 1)})))))
  (testing "insert newline"
    (is (= (text/insert-newline (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["foo" "hello world" "bar"] :cursor (cursor/saved-cursor 5 1)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["foo" "hello" " world" "bar"] :cursor (cursor/saved-cursor 0 2)})))))
  (testing "insert"
    (is (= (text/insert "world" (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello"] :cursor (cursor/saved-cursor 5 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["helloworld"] :cursor (cursor/saved-cursor 10 0)})))))
  (testing "delete"
    (is (= (text/delete (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 10 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello worl"] :cursor (cursor/saved-cursor 10 0)}))))
    (testing "with end cursor of line"
      (is (= (text/delete (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 11 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 11 0)}))))))
  (testing "backspace"
    (is (= (text/backspace (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 1 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["ello world"] :cursor (cursor/saved-cursor 0 0)}))))
    (testing "with start cursor of line"
      (is (= (text/backspace (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 0 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 0 0)}))))))
  (testing "delete line"
    (are [x y] (= x y)
         (text/delete-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["world"] :cursor (cursor/saved-cursor 0 0)}))
         (text/delete-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello"] :cursor (cursor/saved-cursor 0 0)})))
    (testing "with buffer has one line"
      (is (= (text/delete-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 5 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text [""] :cursor (cursor/saved-cursor 0 0)}))))))
  (testing "delete forward"
    (is (= (text/delete-forward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 3 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hel world"] :cursor (cursor/saved-cursor 3 0)}))))
    (is (= (text/delete-forward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 5 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello"] :cursor (cursor/saved-cursor 5 0)})))))
  (testing "delete backward"
    (is (= (text/delete-backward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 3 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["lo world"] :cursor (cursor/saved-cursor 0 0)}))))
    (is (= (text/delete-backward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 6 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["world"] :cursor (cursor/saved-cursor 0 0)})))))
  (testing "delete from cursor"
    (is (= (text/delete-from (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 3 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hel"] :cursor (cursor/saved-cursor 3 0)})))))
  (testing "delete to cursor"
    (is (= (text/delete-to (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 3 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["lo world"] :cursor (cursor/saved-cursor 0 0)}))))))

(deftest cursor
  (testing "move left"
    (is (= (cursor/left (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)}))))
    (testing "with start cursor of line"
      (is (= (cursor/left (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))))
    (testing "with start cursor of buffer"
      (is (= (cursor/left (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))))))
  (testing "move right"
    (is (= (cursor/right (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)}))))
    (testing "with end cursor of line"
      (is (= (cursor/right (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))))
    (testing "with end cursor of buffer"
      (is (= (cursor/right (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)}))))))
  (testing "move up"
    (is (= (cursor/up (assoc (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)}))
                        :view (view/view 5 2)))
           (assoc (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 0)}))
             :view (view/view 5 2))))
    (testing "with top cursor of buffer"
      (is (= (cursor/up (assoc (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 0)}))
                          :view (view/view 5 2)))
             (assoc (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))
               :view (view/view 5 2)))))
    (testing "with lines has diffrent length"
      (is (= (cursor/up (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hell" "world"] :cursor (cursor/saved-cursor 5 1)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hell" "world"] :cursor (cursor/->Cursor 4 0 5)}))))))
  (testing "move down"
    (is (= (cursor/down (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)}))))
    (testing "with bottom cursor of buffer"
      (is (= (cursor/down (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))))
    (testing "with lines has diffrent length"
      (is (= (cursor/down (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "word"] :cursor (cursor/saved-cursor 5 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "word"] :cursor (cursor/->Cursor 4 1 5)}))))))
  (testing "move start line"
    (are [x y] (= x y)
         (cursor/start-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))
         (cursor/start-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)}))))
  (testing "move end line"
    (are [x y] (= x y)
         (cursor/end-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)}))
         (cursor/end-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)}))))
  (testing "move next word"
    (is (= (cursor/forward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 1 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 5 0)}))))
    (testing "with cursor before white space"
      (is (= (cursor/forward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 5 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 11 0)}))))))
  (testing "move previous word"
    (is (= (cursor/backward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 1 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 0 0)}))))
    (testing "with cursor after white space"
      (is (= (cursor/backward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 6 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 0 0)}))))))
  (testing "move start buffer"
    (are [x y] (= x y)
         (cursor/start-buffer (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))
         (cursor/start-buffer (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))))
  (testing "move end buffer"
    (are [x y] (= x y)
         (cursor/end-buffer (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)}))
         (cursor/end-buffer (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))))

(deftest minibuffer
  (testing "history"
    (testing "previous command"
      (is (= (minibuffer/prev-command (assoc (editor/editor)
                                     :history (minibuffer/->History "hello" ["hello" "world"] 0)))
             (assoc (editor/editor)
               :history (minibuffer/->History "hello" ["hello" "world"] 1))))
      (testing "with end cursor of history"
        (is (nil? (minibuffer/prev-command (assoc (editor/editor)
                                     :history (minibuffer/->History  "hello" ["hello" "world"] 1)))))))
    (testing "next command"
      (is (= (minibuffer/next-command (assoc (editor/editor)
                                     :history (minibuffer/->History "hello" ["hello" "world"] 1)))
             (assoc (editor/editor)
               :history (minibuffer/->History "hello" ["hello" "world"] 0))))
      (testing "with start cursor of history"
        (is (nil? (minibuffer/next-command (assoc (editor/editor)
                                          :history (minibuffer/->History "hello" ["hello" "world"] 0)))))))
    (testing "set previous command"
      (is (= (minibuffer/set-prev-command (assoc (editor/editor)
                                         :history (minibuffer/->History "hello" ["hello" "world"] 0)))
             (assoc (editor/editor)
               :history (minibuffer/->History "world" ["hello" "world"] 1))))
      (testing "with end cursor of history"
        (is (= (minibuffer/set-prev-command (assoc (editor/editor)
                                           :history (minibuffer/->History "world" ["hello" "world"] 1)))
               (assoc (editor/editor)
                 :history (minibuffer/->History "world" ["hello" "world"] 1))))))
    (testing "set next command"
      (is (= (minibuffer/set-next-command (assoc (editor/editor)
                                         :history (minibuffer/->History "world" ["hello" "world"] 1)))
             (assoc (editor/editor)
               :history (minibuffer/->History "hello" ["hello" "world"] 0))))
      (testing "with start cursor of history"
        (is (= (minibuffer/set-next-command (assoc (editor/editor)
                                           :history (minibuffer/->History "hello" ["hello" "world"] 0)))
               (assoc (editor/editor)
                 :history (minibuffer/->History "hello" ["hello" "world"] 0)))))))
  (testing "eval command"
    (is (= (minibuffer/eval-command (assoc (editor/editor)
                                      :current :minibuffer
                                      :minibuffer (assoc buffer/default-minibuffer :text ["get-buffer hello"])))
           (-> (editor/editor)
               (buffer/get-buffer :hello)
               (minibuffer/add-history "get-buffer hello"))))))

(deftest buffer
  (testing "create buffer"
    (is (= (buffer/create-buffer (assoc (editor/editor)
                                   :buffers {:hello buffer/default-buffer}
                                   :current :hello)
                                 :world)
           (assoc (editor/editor)
             :buffers {:hello buffer/default-buffer
                       :world buffer/default-buffer}
             :current :world)))
    (testing "with name exists on buffers"
      (is (= (buffer/create-buffer (assoc (editor/editor)
                                     :buffers {:hello buffer/default-buffer}
                                     :current :hello)
                                   :hello)
             (assoc (editor/editor)
               :buffers {:hello buffer/default-buffer}
               :current :hello)))))
  (testing "change buffer"
    (is (= (buffer/change-buffer (assoc (editor/editor)
                                   :buffers {:hello buffer/default-buffer
                                             :world buffer/default-buffer}
                                   :current :hello)
                                 :world)
           (assoc (editor/editor)
             :buffers {:hello buffer/default-buffer
                       :world buffer/default-buffer}
             :current :world)))
    (testing "with name not exists on buffers"
      (is (= (buffer/change-buffer (assoc (editor/editor)
                                     :buffers {:hello buffer/default-buffer}
                                     :current :hello)
                                   :world)
             (assoc (editor/editor)
               :buffers {:hello buffer/default-buffer}
               :current :hello)))))
  (testing "create or change buffer"
    (are [x y] (= x y)
         (buffer/get-buffer (assoc (editor/editor)
                          :buffers {:hello buffer/default-buffer}
                          :current :hello)
                        :world)
         (assoc (editor/editor)
           :buffers {:hello buffer/default-buffer
                     :world buffer/default-buffer}
           :current :world)
         (buffer/get-buffer (assoc (editor/editor)
                          :buffers {:hello buffer/default-buffer
                                    :world buffer/default-buffer}
                          :current :hello)
                        :world)
         (assoc (editor/editor)
           :buffers {:hello buffer/default-buffer
                     :world buffer/default-buffer}
           :current :world)))
  (testing "rename buffer"
    (is (= (buffer/rename-buffer (assoc (editor/editor)
                                   :buffers {:hello buffer/default-buffer}
                                   :current :hello)
                                 :world)
           (assoc (editor/editor)
             :buffers {:world buffer/default-buffer}
             :current :world)))))

(deftest view
  (testing "view"
    (testing "up"
      (is (= (view/up (-> (editor/editor)
                          (assoc :view (view/->View 0 1 5 1))
                          (core/set-text ["hello" "world"])))
             (-> (editor/editor)
                 (assoc :view (view/->View 0 0 5 1))
                 (core/set-text ["hello" "world"]))))
      (testing "above view"
        (is (= (view/up (-> (editor/editor)
                          (assoc :view (view/->View 0 0 5 1))
                          (core/set-text ["hello" "world"])))
             (-> (editor/editor)
                 (assoc :view (view/->View 0 0 5 1))
                 (core/set-text ["hello" "world"]))))))
    (testing "down"
      (is (= (view/down (-> (editor/editor)
                          (assoc :view (view/->View 0 0 5 1))
                          (core/set-text ["hello" "world"])))
             (-> (editor/editor)
                 (assoc :view (view/->View 0 1 5 1))
                 (core/set-text ["hello" "world"]))))
      (testing "below view"
        (is (= (view/down (-> (editor/editor)
                          (assoc :view (view/->View 0 1 5 1))
                          (core/set-text ["hello" "world"])))
             (-> (editor/editor)
                 (assoc :view (view/->View 0 1 5 1))
                 (core/set-text ["hello" "world"]))))))))

(deftest mode
  (testing "key"
    (testing "for general mode"
      (is (= (core/input (assoc (editor/editor) :mode mode/general-mode) :a)
             (text/insert "a" (assoc (editor/editor) :mode mode/general-mode)))))))

(deftest syntax
  (testing "parse clojure"
    (are [x y] (= x y)
         (parser/parse syntax/clojure "(def a 100)")
         [(parser/->Token nil "(")
          (parser/->Token nil "def")
          (parser/->Token nil " ")
          (parser/->Token nil "a")
          (parser/->Token nil " ")
          (parser/->Token :number "100")
          (parser/->Token nil ")")]
         (parser/parse syntax/clojure "\"a\" \"b\"")
         [(parser/->Token :string "\"a\"")
          (parser/->Token nil " ")
          (parser/->Token :string "\"b\"")]))
    (is (time (parser/parse syntax/clojure (slurp "test/one/test.clj")))))
