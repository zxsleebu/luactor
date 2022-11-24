pushd .
cd..
for /f %%f in ('dir /b .\benchmarks\raw') do node ./main.js ./benchmarks/raw/%%f ./benchmarks/protected/%%f
popd