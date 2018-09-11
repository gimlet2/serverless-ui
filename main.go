package main

import (
	"archive/zip"
	"bytes"
	// "bytes"
	// "compress/gzip"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"

	"github.com/ericchiang/k8s"
	metav1 "github.com/ericchiang/k8s/apis/meta/v1"
	"github.com/ghodss/yaml"
)

type FunctionResource struct {
	Metadata *metav1.ObjectMeta `json:"metadata"`
	Spec     Spec               `json:"spec"`
}

type Spec struct {
	Schedule string  `json:"schedule,omitempty"`
	Type     string  `json:"type"`
	Service  Service `json:"service"`
	Function string  `json:"function"`
	Deps     string  `json:"deps"`
}
type Service struct {
	Ports []Port `json:"ports"`
}

type Port struct {
	Name string `json:"name"`
	Port int    `json:"port"`
}

func (m *FunctionResource) GetMetadata() *metav1.ObjectMeta {
	return m.Metadata
}

type FunctionResourceList struct {
	Metadata *metav1.ListMeta   `json:"metadata"`
	Items    []FunctionResource `json:"items"`
}

// Require for MyResourceList to implement k8s.ResourceList
func (m *FunctionResourceList) GetMetadata() *metav1.ListMeta {
	return m.Metadata
}

func loadClient(kubeconfigPath string) (*k8s.Client, error) {
	data, err := ioutil.ReadFile(kubeconfigPath)
	if err != nil {
		return nil, fmt.Errorf("read kubeconfig: %v", err)
	}

	// Unmarshal YAML into a Kubernetes config object.
	var config k8s.Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("unmarshal kubeconfig: %v", err)
	}
	return k8s.NewClient(&config)
}

func main() {
	log.Print("Start")
	kubeConfigPath := "/home/user/.kube/config"
	// kubeConfigPath := os.Getenv("KUBE_CONFIG") //"/home/user/.kube/config"
	var client *k8s.Client
	var err error
	if kubeConfigPath != "" {
		client, err = loadClient(kubeConfigPath)
	} else {
		client, err = k8s.NewInClusterClient()
	}
	if err != nil {
		log.Fatal(err)
	}
	k8s.Register("kubeless.io", "v1beta1", "functions", true, &FunctionResource{})
	k8s.RegisterList("kubeless.io", "v1beta1", "functions", true, &FunctionResourceList{})
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r := mux.NewRouter()

	get(r, "/functions", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var functions FunctionResourceList
		err = client.List(context.Background(), k8s.AllNamespaces, &functions)
		j, _ := json.Marshal(functions)
		w.Header().Set("Content-Type", "application/json")
		w.Write(j)
	})

	get(r, "/function/{namespace}/{name}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		w.Header().Set("Content-Type", "application/json")
		log.Printf("Name %s", vars["name"])
		var function FunctionResource
		err = client.Get(context.Background(), vars["namespace"], vars["name"], &function)
		j, _ := json.Marshal(function)
		w.Header().Set("Content-Type", "application/json")
		w.Write(j)
	})

	get(r, "/function/{namespace}/{name}/files", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		log.Printf("Name %s", vars["name"])
		var function FunctionResource
		err = client.Get(context.Background(), vars["namespace"], vars["name"], &function)
		data, _ := base64.StdEncoding.DecodeString(function.Spec.Function)
		// fmt.Println(data)
		rdata := bytes.NewReader(data)
		rr, _ := zip.NewReader(rdata, int64(len(data)))
		names := []string{}
		for _, f := range rr.File {
			names = append(names, f.FileHeader.Name)
		}
		j, _ := json.Marshal(names)

		w.Header().Set("Content-Type", "application/json")
		w.Write(j)
	})

	get(r, "/function/{namespace}/{name}/files/", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		var function FunctionResource
		err = client.Get(context.Background(), vars["namespace"], vars["name"], &function)
		data, _ := base64.StdEncoding.DecodeString(function.Spec.Function)
		rdata := bytes.NewReader(data)
		rr, _ := zip.NewReader(rdata, int64(len(data)))
		s := []byte{}
		for ind, f := range rr.File {
			if r.URL.Query()["file"][0] == f.FileHeader.Name {
				df, _ := rr.File[ind].Open()
				s, _ = ioutil.ReadAll(df)
			}
		}
		w.Header().Set("Content-Type", "text")
		w.Write(s)
	})

	srv := &http.Server{
		Addr: "0.0.0.0:" + port,
		// Good practice to set timeouts to avoid Slowloris attacks.
		WriteTimeout: time.Second * 15,
		ReadTimeout:  time.Second * 15,
		IdleTimeout:  time.Second * 60,
		Handler:      r, // Pass our instance of gorilla/mux in.
	}
	log.Fatal(srv.ListenAndServe())

}

func get(r *mux.Router, pattern string, handler func(w http.ResponseWriter, r *http.Request)) {
	r.HandleFunc(pattern, handler).Methods("GET")
}
