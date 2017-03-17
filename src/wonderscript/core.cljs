(ns wonderscript.core
  (:require [cljs.reader :as reader]
            [clojure.string :as s]))

(enable-console-print!)

(defn ^:export readString [s]
  (let [form (reader/read-string s)
        t (type form)
        tag (if (s/blank? (.-name t))
                (.-cljs$lang$ctorStr t)
                (.-name t))]
    {:form form :tag tag}))

; Syntax -> JSString
(defn ^:export emit [form]
  (let [tag (:tag form)]
    (cond (= tag "String") (str "\"" (:form form) "\"")
          (= tag "Number") (str (:form form))
          (= tag "cljs.core/Keyword") (str "\"" (name (:form form)) "\"")
          (= tag "cljs.core/Symbol") (name (:form form))
          (= tag "cljs.core/PersistentHashMap") (clj->js (:form form)))))

(defn ^:export eval [form]
  (js/eval (emit form)))

(defn show [value]
  (let [c (.. js/document (createElement "DIV"))]
    (aset c "innerHTML" value)
    (.. js/document (getElementById "container") (appendChild c))))


(defn main []
  (println (readString "1"))
  (println (readString "\"A B C\""))
  (println (readString ":a"))
  (println (readString "a"))
  (println (readString "{:a 1 :b 2}"))
  )
