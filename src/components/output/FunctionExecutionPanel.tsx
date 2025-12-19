import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Play, Eye, Loader2, ExternalLink, Copy, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { executeFunction, simulateFunction } from '../../lib/api';
import { useAppStore } from '../../stores/appStore';

interface FunctionExecutionPanelProps {
  contractAddress?: string;
  abi?: any[];
  network?: string;
}

const FunctionExecutionPanel: React.FC<FunctionExecutionPanelProps> = ({
  contractAddress: initialAddress,
  abi: initialAbi,
  network = 'arbitrum_sepolia'
}) => {
  const { toast } = useToast();
  const { solidityCompilationResult, rustCompilationResult } = useAppStore();
  
  const [contractAddress, setContractAddress] = useState(initialAddress || '');
  const [abi, setAbi] = useState<any[]>(initialAbi || []);
  const [selectedFunction, setSelectedFunction] = useState<any>(null);
  const [parameters, setParameters] = useState<string[]>([]);
  const [privateKey, setPrivateKey] = useState('');
  const [gasLimit, setGasLimit] = useState('');
  const [gasPrice, setGasPrice] = useState('');
  const [value, setValue] = useState('0');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionResults, setExecutionResults] = useState<any[]>([]);

  // Load ABI from compilation results if available
  useEffect(() => {
    if (!abi.length) {
      const compilationResult = solidityCompilationResult || rustCompilationResult;
      if (compilationResult?.abi) {
        setAbi(compilationResult.abi);
      }
    }
  }, [solidityCompilationResult, rustCompilationResult, abi.length]);

  // Filter functions from ABI
  const functions = abi.filter(item => item.type === 'function');
  const readFunctions = functions.filter(fn => fn.stateMutability === 'view' || fn.stateMutability === 'pure');
  const writeFunctions = functions.filter(fn => fn.stateMutability !== 'view' && fn.stateMutability !== 'pure');

  const handleFunctionSelect = (functionName: string) => {
    const func = functions.find(f => f.name === functionName);
    setSelectedFunction(func);
    if (func) {
      setParameters(new Array(func.inputs?.length || 0).fill(''));
    }
  };

  const handleParameterChange = (index: number, value: string) => {
    const newParams = [...parameters];
    newParams[index] = value;
    setParameters(newParams);
  };

  const parseParameters = (func: any, rawParams: string[]) => {
    return rawParams.map((param, index) => {
      const inputType = func.inputs[index]?.type;
      if (!param.trim()) return param;

      try {
        if (inputType?.includes('uint') || inputType?.includes('int')) {
          return param.trim();
        } else if (inputType === 'bool') {
          return param.toLowerCase() === 'true';
        } else if (inputType?.includes('[]')) {
          return JSON.parse(param);
        }
        return param;
      } catch (e) {
        return param;
      }
    });
  };

  const handleExecute = async () => {
    if (!contractAddress || !selectedFunction) {
      toast({
        title: 'Missing Information',
        description: 'Please provide contract address and select a function',
        variant: 'destructive',
      });
      return;
    }

    const isReadOnly = selectedFunction.stateMutability === 'view' || selectedFunction.stateMutability === 'pure';
    
    if (!isReadOnly && !privateKey) {
      toast({
        title: 'Private Key Required',
        description: 'Write operations require a private key',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);

    try {
      const parsedParams = parseParameters(selectedFunction, parameters);
      
      const result = await executeFunction(
        contractAddress,
        abi,
        selectedFunction.name,
        parsedParams,
        network,
        privateKey || undefined,
        {
          gasLimit: gasLimit || undefined,
          gasPrice: gasPrice || undefined,
          value: value || '0'
        }
      );

      const newResult = {
        id: Date.now(),
        timestamp: new Date(),
        functionName: selectedFunction.name,
        type: isReadOnly ? 'read' : 'write',
        parameters: parsedParams,
        ...result
      };

      setExecutionResults([newResult, ...executionResults]);

      if (result.success) {
        toast({
          title: 'Function Executed Successfully',
          description: isReadOnly 
            ? `Read operation completed`
            : `Transaction sent: ${result.txHash}`,
        });
      } else {
        toast({
          title: 'Execution Failed',
          description: result.error,
          variant: 'destructive',
        });
      }

    } catch (error) {
      toast({
        title: 'Execution Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSimulate = async () => {
    if (!contractAddress || !selectedFunction) {
      toast({
        title: 'Missing Information',
        description: 'Please provide contract address and select a function',
        variant: 'destructive',
      });
      return;
    }

    setIsSimulating(true);

    try {
      const parsedParams = parseParameters(selectedFunction, parameters);
      
      const result = await simulateFunction(
        contractAddress,
        abi,
        selectedFunction.name,
        parsedParams,
        network
      );

      const newResult = {
        id: Date.now(),
        timestamp: new Date(),
        functionName: selectedFunction.name,
        type: 'simulation',
        parameters: parsedParams,
        ...result
      };

      setExecutionResults([newResult, ...executionResults]);

      if (result.success) {
        toast({
          title: 'Simulation Completed',
          description: 'Function simulation successful',
        });
      } else {
        toast({
          title: 'Simulation Failed',
          description: result.error,
          variant: 'destructive',
        });
      }

    } catch (error) {
      toast({
        title: 'Simulation Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="h-full p-6 space-y-6 overflow-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-700/50">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-500/10 border border-purple-500/20">
          <Play className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Function Execution</h2>
          <p className="text-sm text-slate-400">Execute smart contract functions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Function Execution Form */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              Contract Setup
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract-address" className="text-slate-300 font-medium">Contract Address</Label>
                <Input
                  id="contract-address"
                  placeholder="0x..."
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>

              {abi.length === 0 && (
                <div className="space-y-2">
                  <Label htmlFor="abi-input" className="text-slate-300 font-medium">Contract ABI (JSON)</Label>
                  <Textarea
                    id="abi-input"
                    placeholder="Paste contract ABI here..."
                    className="h-24 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20"
                    onChange={(e) => {
                      try {
                        const parsedAbi = JSON.parse(e.target.value);
                        setAbi(parsedAbi);
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {functions.length > 0 && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-slate-700/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                Function Selection
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 font-medium">Select Function</Label>
                  <Select onValueChange={handleFunctionSelect}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white focus:border-purple-400 focus:ring-purple-400/20">
                      <SelectValue placeholder="Choose a function to execute" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {readFunctions.length > 0 && (
                        <>
                          <div className="px-3 py-2 text-sm font-semibold text-emerald-400 border-b border-slate-700">
                            📖 Read Functions
                          </div>
                          {readFunctions.map((func) => (
                            <SelectItem key={func.name} value={func.name} className="text-white hover:bg-slate-700">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="font-medium">{func.name}</span>
                                <Badge variant="outline" className="ml-auto text-xs text-emerald-400 border-emerald-400/30">
                                  view
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {writeFunctions.length > 0 && (
                        <>
                          {readFunctions.length > 0 && <Separator className="bg-slate-700" />}
                          <div className="px-3 py-2 text-sm font-semibold text-orange-400 border-b border-slate-700">
                            ✏️ Write Functions
                          </div>
                          {writeFunctions.map((func) => (
                            <SelectItem key={func.name} value={func.name} className="text-white hover:bg-slate-700">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-400" />
                                <span className="font-medium">{func.name}</span>
                                <Badge variant="outline" className="ml-auto text-xs text-orange-400 border-orange-400/30">
                                  write
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {selectedFunction && selectedFunction.inputs?.length > 0 && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-slate-700/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                Function Parameters
              </h3>
              <div className="space-y-4">
                {selectedFunction.inputs.map((input: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-slate-300 font-medium flex items-center gap-2">
                      <span className="text-blue-400">#{index + 1}</span>
                      {input.name || `param${index}`}
                      <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                        {input.type}
                      </Badge>
                    </Label>
                    <Input
                      placeholder={`Enter ${input.type} value`}
                      value={parameters[index] || ''}
                      onChange={(e) => handleParameterChange(index, e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedFunction && selectedFunction.stateMutability !== 'view' && selectedFunction.stateMutability !== 'pure' && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-slate-700/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                Transaction Settings
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="private-key" className="text-slate-300 font-medium">Private Key (for write operations)</Label>
                  <Input
                    id="private-key"
                    type="password"
                    placeholder="0x..."
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-400 focus:ring-orange-400/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gas-limit" className="text-slate-300 font-medium">Gas Limit (optional)</Label>
                    <Input
                      id="gas-limit"
                      placeholder="3000000"
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-400 focus:ring-orange-400/20"
                      value={gasLimit}
                      onChange={(e) => setGasLimit(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value" className="text-slate-300 font-medium">ETH Value</Label>
                    <Input
                      id="value"
                      placeholder="0"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-400 focus:ring-orange-400/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedFunction && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex gap-4">
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting || isSimulating}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-emerald-500/25 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleSimulate}
                  disabled={isExecuting || isSimulating}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl border border-slate-600 hover:border-slate-500 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Simulate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Execution Results */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border border-emerald-400/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              Execution Results
            </h3>
            
            <ScrollArea className="h-96">
              {executionResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-600/20 to-slate-500/10 backdrop-blur-sm border border-slate-500/20 mb-6">
                    <CheckCircle className="w-16 h-16 text-slate-400 mx-auto drop-shadow-lg" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-300 mb-2">No Executions Yet</h4>
                  <p className="text-sm text-slate-400 mb-1">Function execution results will appear here</p>
                  <p className="text-xs text-slate-500">Execute or simulate a function to see results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {executionResults.map((result, index) => (
                    <div 
                      key={result.id} 
                      className="group p-4 rounded-xl bg-gradient-to-br from-slate-700/60 to-slate-600/40 border border-slate-600/50 backdrop-blur-sm hover:border-slate-500/60 transition-all duration-300"
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                        animation: 'slideInFromTop 0.4s ease-out forwards'
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            result.success 
                              ? 'bg-emerald-500/20 border border-emerald-400/20' 
                              : 'bg-red-500/20 border border-red-400/20'
                          }`}>
                            {result.success ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{result.functionName}</span>
                            <Badge className={`text-xs ${
                              result.type === 'read' 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30' 
                                : 'bg-orange-500/20 text-orange-400 border-orange-400/30'
                            }`}>
                              {result.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                          {result.success && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30 text-xs">
                              SUCCESS
                            </Badge>
                          )}
                        </div>
                      </div>

                      {result.parameters && result.parameters.length > 0 && (
                        <div className="mb-3">
                          <Label className="text-xs text-slate-400 font-medium mb-2 block">Parameters:</Label>
                          <div className="text-sm font-mono bg-slate-800/60 border border-slate-600/50 p-3 rounded-lg text-slate-300">
                            {JSON.stringify(result.parameters, null, 2)}
                          </div>
                        </div>
                      )}

                      {result.success && result.result !== undefined && (
                        <div className="mb-3">
                          <Label className="text-xs text-slate-400 font-medium mb-2 block">Result:</Label>
                          <div className="text-sm font-mono bg-slate-800/60 border border-slate-600/50 p-3 rounded-lg text-emerald-300">
                            {typeof result.result === 'object' 
                              ? JSON.stringify(result.result, null, 2) 
                              : String(result.result)
                            }
                          </div>
                        </div>
                      )}

                      {result.error && (
                        <div className="mb-3">
                          <Label className="text-xs text-red-400 font-medium mb-2 block">Error:</Label>
                          <div className="text-sm font-mono bg-red-900/20 border border-red-500/30 p-3 rounded-lg text-red-300">
                            {result.error}
                          </div>
                        </div>
                      )}

                      {result.txHash && (
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600/50">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Transaction Hash:</span>
                            <div className="flex items-center gap-2">
                              <code className="text-blue-300 bg-slate-700/50 px-2 py-1 rounded text-xs">
                                {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(result.txHash)}
                                className="p-1 h-auto text-slate-400 hover:text-white hover:bg-slate-700/50"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              {result.explorerUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(result.explorerUrl, '_blank')}
                                  className="p-1 h-auto text-slate-400 hover:text-white hover:bg-slate-700/50"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {result.gasUsed && (
                        <div className="mt-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg border border-slate-600/50">
                          <span className="font-medium">Gas used:</span> {result.gasUsed}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionExecutionPanel;