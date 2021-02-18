package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"
)

func main() {
	var delayDuration time.Duration

	if len(os.Args) == 2 {
		delay, err := strconv.ParseInt(os.Args[1], 10, 0)

		if err != nil {
			log.Fatalf("Can't convert %s to a number: %s", os.Args[0], err)
			return
		}

		delayDuration = time.Duration(delay) * time.Millisecond
	} else {
		delayDuration = 1 * time.Second
	}

	for i := 0; i < 100; i++ {
		time.Sleep(delayDuration)
		fmt.Printf("chatty: %d\n", i)
	}
}